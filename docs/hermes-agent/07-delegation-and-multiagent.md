---
slug: 07-delegation-and-multiagent
sidebar_position: 7
title: "위임 & 멀티에이전트: delegate_task와 dispatcher 패턴"
---

이번 편에서는 에이전트가 다른 에이전트에게 일을 맡기는 방식을 본다. 위임이 왜 컨텍스트를 아끼는 전략인지, 그리고 "구현은 A에게, 리뷰는 B에게" 같은 dispatcher 패턴을 어떻게 만들 수 있는지 따라간다.

[#6 교훈 6](./06-lessons-for-builders)에서 위임을 짧게 예고했다. 이번 편은 그 내용을 더 깊게 다룬다. 코딩 자동화에 관심이 있다면 이 편이 핵심이다.

---

## 들어가며: 에이전트 하나로는 부족할 때

Hermes를 쓰다 보면 이런 상황이 온다.

> "이 PR 50개를 분석해서 위험한 것만 추려줘"

이걸 메인 대화에서 그대로 처리하면 어떻게 될까. PR 50개의 diff, 파일 내용, 중간 분석이 전부 메인 컨텍스트에 쌓인다. 토큰은 폭발하고, 정작 중요한 "최종 결론"은 그 더미에 파묻힌다.

여기서 쓸 수 있는 것이 위임(delegation)이다.

```mermaid
flowchart LR
    subgraph WRONG["잘못된 방식: 직접 처리"]
        M1["메인 에이전트"] --> W["PR 50개 분석<br/>(중간 과정 전부<br/>메인에 쌓임)"]
        W --> POLLUTE["컨텍스트 오염"]
    end
    subgraph RIGHT["올바른 방식: 위임"]
        M2["메인 에이전트"] -->|"delegate_task"| SUB["subagent<br/>(격리된 컨텍스트)"]
        SUB -->|"50개 분석은 여기서"| WORK["중간 과정 소모"]
        SUB -->|"최종 요약만"| M2
    end
```

위임은 일손을 늘리는 수단이기도 하지만, 더 본질적으로는 메인 에이전트의 컨텍스트를 깨끗하게 지키는 전략이다.

---

## delegate_task란

`delegate_task`는 자식 AIAgent를 띄우는 도구다. 자식은 독립된 환경을 가진다.

```mermaid
flowchart TD
    PARENT["부모 에이전트"] -->|"delegate_task(goal=...)"| CHILD["자식 에이전트"]
    CHILD --> C1["독립된 대화 컨텍스트"]
    CHILD --> C2["독립된 터미널 세션"]
    CHILD --> C3["제한된 toolset"]
    CHILD -->|"작업 끝나면"| SUM["최종 요약만 부모에게"]
    SUM --> PARENT
```

가장 중요한 특성은 부모가 자식의 중간 과정을 보지 않는다는 점이다. 부모는 오직 최종 요약만 받는다.

#2에서 봤듯 도구 결과는 전부 대화 기록에 쌓인다. 그런데 위임은 그 규칙을 우회한다. 자식이 도구를 100번 부르든, 부모가 받는 것은 마지막 요약 한 덩어리뿐이다.

관련 코드: `tools/delegate_tool.py`. 주석 첫 줄에 이렇게 적혀 있다. *"Spawns child AIAgent instances with isolated context... The parent's context only sees the delegation call and the summary result."*

---

## 두 가지 모드: 단일 vs 배치(병렬)

```mermaid
flowchart TD
    subgraph SINGLE["단일 모드"]
        S["delegate_task(goal='...')"] --> S1["자식 1명"]
    end
    subgraph BATCH["배치 모드 (병렬)"]
        B["delegate_task(tasks=[...])"] --> B1["자식 A"]
        B --> B2["자식 B"]
        B --> B3["자식 C"]
        B1 & B2 & B3 -->|"동시 실행"| MERGE["결과 한꺼번에 반환"]
    end
```

- 단일: `goal` 하나 → 자식 1명
- 배치: `tasks=[{...}, {...}]` → 여러 자식 병렬 실행

병렬은 `ThreadPoolExecutor`로 돌고, 동시 실행 수는 `delegation.max_concurrent_children`(기본 3)으로 제한된다.

독립적인 일 여러 개(예: A 조사 + B 조사를 동시에)는 배치가 적합하다. 서로 의존하는 작업이면 순차로 해야 하므로 단일을 여러 번 호출한다.

---

## 역할(role): leaf vs orchestrator

자식 에이전트에는 두 가지 역할이 있다.

```mermaid
flowchart TD
    P["부모"] --> Q{"자식 role?"}
    Q -->|"leaf (기본)"| LEAF["일만 함<br/>재위임 불가"]
    Q -->|"orchestrator"| ORCH["자기도 자식을<br/>또 띄울 수 있음"]
    ORCH -.->|"max_spawn_depth 까지"| GRANDCHILD["손자 에이전트"]
```

| 역할 | 설명 | 재위임 |
|------|------|--------|
| `leaf` (기본) | 집중 작업자. 일만 하고 끝 | 안됨 |
| `orchestrator` | 자기도 하위 작업자를 띄울 수 있음 | 가능 (깊이 제한 내) |

기본은 `leaf`이고, 깊이 제한(`MAX_DEPTH = 1`)이 걸려 있다. 즉 기본 설정에서는 부모(0) → 자식(1)까지만 가고, 손자는 막힌다. `delegation.max_spawn_depth`를 올리면 더 깊이 갈 수 있다.

기본값이 평평한(flat) 이유는 무한 재귀 위임으로 에이전트가 폭증하는 것을 막기 위해서다. 깊이를 열려면 사용자가 명시적으로 설정해야 한다.

---

## 위임의 한계

위임은 유용하지만 만능은 아니다. 코드와 문서에서 확인한 제약은 다음과 같다.

```mermaid
flowchart TD
    L["delegate_task의 한계"] --> L1["동기적 — 부모 턴 안에서 실행<br/>부모가 중단되면 자식도 취소"]
    L --> L2["자식은 부모 대화를<br/>기억 못 함 (context로 다 넘겨야)"]
    L --> L3["leaf는 clarify·delegate·<br/>memory·send_message 못 씀"]
    L --> L4["요약은 self-report<br/>외부 부작용은 부모가 검증해야"]
```

특히 두 가지가 실무에서 중요하다.

1. 자식은 부모 대화를 모른다. 자식은 백지에서 시작하므로, 필요한 정보(파일 경로, 제약, 에러 메시지)를 `context`에 전부 명시해야 한다. "아까 그거"는 통하지 않는다.

2. 요약은 자기 보고(self-report)다. 자식이 "파일 업로드 성공"이라고 해도 그것은 자식의 주장일 뿐이다. HTTP POST, 파일 생성 같은 외부 부작용은 부모가 직접 검증(URL fetch, 파일 stat)해야 한다.

오래 걸리는 durable 작업(턴을 넘겨 살아야 하는 것)은 위임이 아니라 cron이나 background 프로세스를 써야 한다. 위임은 부모 턴이 끝나면 같이 종료되기 때문이다. (cron은 #9에서 다룬다.)

---

## 위임 vs 다른 선택지

언제 위임을 쓰고 언제 다른 것을 쓸지 판단하는 기준이다.

```mermaid
flowchart TD
    NEED["하위 작업이 필요"] --> Q1{"추론이<br/>필요한가?"}
    Q1 -->|"아니오 (기계적 다단계)"| EXEC["execute_code<br/>(스크립트로)"]
    Q1 -->|"예"| Q2{"컨텍스트를<br/>오염시키나?"}
    Q2 -->|"아니오 (단순)"| DIRECT["그냥 직접 처리"]
    Q2 -->|"예 (대량 중간결과)"| Q3{"턴을 넘겨<br/>살아야 하나?"}
    Q3 -->|"아니오"| DELEGATE["delegate_task"]
    Q3 -->|"예 (장시간)"| CRON["cron / background"]
```

| 상황 | 선택 |
|------|------|
| 기계적 다단계 (추론 불필요) | `execute_code` (스크립트) |
| 단순 단일 작업 | 그냥 직접 |
| 컨텍스트 오염 + 추론 필요 | `delegate_task` |
| 장시간 / 턴 넘김 | cron / background |

---

## 실전: dispatcher 패턴 만들기

위임으로 "구현은 A, 리뷰는 B" 같은 dispatcher를 만들 수 있다. 코딩 자동화에서 유용한 패턴이다.

```mermaid
flowchart TD
    USER["사용자: '이 기능 구현해줘'"] --> DISP["Dispatcher 에이전트<br/>(메인)"]
    DISP --> SOT["1. 요구사항 정리<br/>(issue/스펙 = 판단 기준)"]
    SOT --> D1["2. 구현 위임<br/>delegate(goal=구현)"]
    D1 --> IMPL["구현 subagent"]
    IMPL -->|"diff + 결과"| DISP
    DISP --> D2["3. 리뷰 위임<br/>delegate(goal=리뷰)"]
    D2 --> REV["리뷰 subagent"]
    REV -->|"리뷰 코멘트"| DISP
    DISP --> VERIFY["4. 부모가 직접 검증<br/>(파일·테스트 실제 확인)"]
    VERIFY --> REPORT["5. 사용자에게 보고"]
```

dispatcher 패턴의 핵심 원칙은 다음과 같다.

1. Dispatcher는 직접 코드를 짜지 않는다. 요구사항을 정리하고, 일을 나눠 위임하고, 결과를 검증·종합한다.
2. 판단 기준(Source of Truth)을 먼저 고정한다. issue 본문, 스펙 등을 기준으로 삼아야 자식들의 결과를 평가할 수 있다.
3. 구현과 리뷰를 분리한다. 같은 에이전트가 짜고 리뷰하면 자기 검열이 약하다. 다른 subagent에게 맡긴다.
4. 외부 부작용은 dispatcher가 직접 검증한다. "테스트 통과했다"는 자식 보고를 그대로 믿지 말고, 부모가 실제로 돌려본다.

Hermes는 한 발 더 나아가, `delegate_task`의 `acp_command`로 외부 코딩 CLI(Codex, Claude Code 등)를 자식으로 띄울 수도 있다. 즉 "Hermes가 dispatcher, 실제 구현은 Codex"라는 조합도 가능하다.

---

## 멀티에이전트의 더 큰 그림: Kanban

`delegate_task`는 "부모 턴 안의 단기 위임"이다. 그런데 더 크고 durable한 멀티에이전트 협업이 필요하면 어떻게 할까. Hermes에는 Kanban이라는 별도 시스템이 있다.

```mermaid
flowchart LR
    subgraph DELEGATE["delegate_task"]
        D1["부모 턴 안에서"]
        D2["동기적 · 단기"]
        D3["끝나면 사라짐"]
    end
    subgraph KANBAN["Kanban 보드"]
        K1["공유 SQLite 보드"]
        K2["여러 프로필이 작업 집어감"]
        K3["durable · 장기"]
    end
```

| | `delegate_task` | Kanban |
|---|---|---|
| 수명 | 부모 턴 (단기) | 보드에 영구 (장기) |
| 방식 | 동기적 호출 | 작업 큐에서 집어감 |
| 협업 | 부모↔자식 | 여러 프로필 간 |
| 용도 | 빠른 병렬 하위작업 | 크로스 에이전트 핸드오프 |

[#3](./03-system-prompt)에서 `KANBAN_GUIDANCE` 프롬프트를 봤다. 그것이 바로 Kanban worker로 스폰된 에이전트가 받는 작업 규약이다. (Kanban 심화는 [#15 Kanban 독립 워커](./15-kanban-workers)에서 다룬다.)

선택 기준은 단순하다. 한 번의 작업 안에서 끝나는 병렬 처리는 `delegate_task`, 여러 세션·프로필을 넘나드는 지속적 협업은 Kanban이다.

---

## 이번 편 정리

```mermaid
flowchart TD
    A["delegate_task"] --> B["격리된 자식 에이전트"]
    B --> C["부모는 최종 요약만 받음<br/>(컨텍스트 보호)"]
    A --> D["단일 / 배치(병렬 3개)"]
    A --> E["leaf(기본) / orchestrator"]
    C --> F["dispatcher 패턴:<br/>구현·리뷰 분리 + 부모 검증"]
    F --> G["durable 협업은<br/>Kanban으로"]
```

- 위임은 일손 늘리기이자 컨텍스트를 지키는 전략이다 (부모는 요약만 받음).
- 단일/배치(병렬), leaf/orchestrator 역할, 깊이 제한이 있다.
- 자식은 부모 대화를 모르므로 context에 다 넘겨야 하고, 요약은 self-report라 검증이 필요하다.
- dispatcher 패턴은 요구사항 고정 → 구현/리뷰 분리 위임 → 부모가 검증 → 보고 순으로 진행한다.
- 단기 병렬은 `delegate_task`, 장기 협업은 Kanban이다.

---

## 다음 편 예고

#8 게이트웨이, 20개 플랫폼을 한 프로세스로

지금까지는 "에이전트 내부"를 다뤘다. 이제 밖으로 나가서, Hermes가 어떻게 텔레그램·디스코드·슬랙 등 20개 메시징 플랫폼을 하나의 게이트웨이 프로세스로 돌리는지, 그리고 그 메시지가 어떻게 #2에서 본 AIAgent로 흘러가는지 본다.

관련 코드: `tools/delegate_tool.py` · 관련 문서: `developer-guide/tools-runtime.md`, `user-guide/features/delegation.md`
