---
sidebar_position: 3
title: "RAG 청킹: Late Chunking & Contextual Retrieval"
---

> **원문**
>
> - Late Chunking: [Contextual Chunk Embeddings Using Long-Context Embedding Models (arXiv:2409.04701)](https://arxiv.org/abs/2409.04701)
> - Contextual Retrieval: [Introducing Contextual Retrieval — Anthropic](https://www.anthropic.com/news/contextual-retrieval)

---

### 초록 (Abstract)

#### 연구 배경

RAG는 LLM의 출력을 외부 지식 소스에 기반(grounding)하여 향상시키는 혁신적인 접근 방식

- grounding이란? LLM이 자신의 학습 데이터만으로 답변을 생성하는게 아니라 실제 문서나 데이터베이스에서 가져온 정보를 근거로 삼아 답변하는 것

#### 핵심 문제

**LLM의 입력 제약 조건(토큰 수 제한) 내에서 방대한 양의 외부 지식을 어떻게 효과적으로 관리할 수 있는가?**

#### 기존 해결책과 한계

- 기존 방법은 외부 문서를 더 작고 고정된 크기의 세**그먼트로 청킹(chunking, 문서를 작은 조각으로 나누는 것)**하여 이 문제를 해결해왔음
- 이 접근 방식은 입력 제한을 완화하지만 종종 **컨텍스트를 단편화 문제가 발생함**
    - 불완전한 검색
    - 생성의 일관성 저하

#### 새로운 기술 등장

이러한 단점을 극복하기 위해 **전역 컨텍스트(global context, 문서 전체의 맥락 정보)**를 보존하는 것을 목표로 하는 두 가지 고급 기술이 도입되었음

1. **Late Chunking**: 문서 전체를 먼저 임베딩한 후 나중에 청크로 분할
2. **Contextual Retrieval**: 각 청크에 LLM이 생성한 맥락 정보를 추가

#### 연구 결과 요약

| 기술 | 장점 | 단점 |
| --- | --- | --- |
| Contextual Retrieval | 의미론적 일관성을 더 효과적으로 보존 | 더 많은 계산 자원 필요 |
| Late Chunking | 더 높은 효율성 | 관련성과 완전성 희생 경향 |

---

### 1. 서론 (Introduction)

#### 1.1 RAG란 무엇인가?

RAG는 **외부 정보 검색을 텍스트 생성 프로세스에 직접 통합**하여 LLM의 기능을 향상시키는 접근 방식

**RAG의 작동 원리:**

`사용자 질문 → 관련 문서 검색 → 검색된 문서 + 질문을 LLM에 전달 → 답변 생성`

**RAG의 두 가지 핵심 구성 요소:**

1. **검색 메커니즘 (Retrieval Mechanism)**
    - 대규모 말뭉치(corpus, 문서들의 집합)에서 관련 문서 또는 데이터를 가져옴
    - 예: 벡터 데이터베이스에서 유사한 문서 검색
2. **생성 모델 (Generative Model)**
    - 검색된 정보를 일관성 있고 맥락적으로 풍부한 답변으로 종합
    - 예: GPT, Claude 등의 LLM

**RAG의 장점:**

- 사전 훈련된 데이터에만 의존하는 **정적(static) LLM**과 달리, RAG 지원 모델은 **최신 정보**와 **도메인별 정보**에 액세스 가능
- 빠르게 진화하거나 전문화된 분야에서도 생성된 콘텐츠가 관련성과 정확성을 유지

#### 1.2 클래식 RAG의 컨텍스트 딜레마 (Context Dilemma)

#### 문제 1: 토큰 수 제한

- 많은 LLM은 **수천 개의 토큰만 처리** 가능하도록 제한
- 일부 모델은 최대 **수백만 개의 토큰**에 달하는 컨텍스트 창(context window)을 달성했지만, 이는 예외적인 경우

#### 문제 2: 위치 편향 (Positional Bias)

LLM은 **위치 편향**을 나타낸다:

- 문서 **시작 부분**의 정보: 더 나은 성능
- 문서 **중간 또는 끝 부분**의 정보: 처리에 어려움

이를 "Lost in the Middle" 문제라고도 부른다. (긴 문서의 중간에 있는 중요한 정보를 LLM이 놓치는 현상)

#### 기존 해결책: 청킹 (Chunking)

- 문서를 **더 작은 세그먼트 또는 "청크"로 나누어** 임베딩 및 검색을 수행함

#### 청킹의 부작용

**1. 맥락 손실 (Loss of Context)**

```python
원본 문서:
"ACME Corp는 2023년 3분기에 전년 대비 15% 성장했다. 
회사의 수익은 이전 분기보다 3% 증가했다."

청크 1: "ACME Corp는 2023년 3분기에 전년 대비 15% 성장했다."
청크 2: "회사의 수익은 이전 분기보다 3% 증가했다."
         ↑ 어떤 회사? 어떤 기간? 알 수 없음
```

의미론적 경계(semantic boundaries, 의미가 자연스럽게 끊기는 지점)를 고려하지 않고 문서를 나누면 **충분한 맥락이 없는 청크**가 생성되어 모델이 정확하고 일관된 응답을 생성하는 능력이 저하됨

**2. 불완전한 정보 검색 (Incomplete Information Retrieval)**
중요한 정보가 여러 청크에 분산되면 효과적으로 검색되거나 통합되지 않을 수 있음

#### 1.3 본 연구의 접근법

두 가지 최신 기술을 분석하고 비교

| 기술 | 접근 방식 |
| --- | --- |
| **Contextual Retrieval** | LLM에서 생성된 컨텍스트를 청크에 추가(prepend)하여 일관성 유지 |
| **Late Chunking** | 분할하기 **전에** 전체 문서를 임베딩하여 전역 컨텍스트 유지 |

**연구 결과:** 두 기술 모두 **결정적인 해결책을 제공하지 못함**. 각 방법 간의 절충점(trade-offs)이 존재함

---

### 2. 관련 연구 (Related Work)

#### 2.1 클래식 RAG 워크플로우

표준 RAG 워크플로우는 **4단계**로 구성된다:

**문서 분할 → 청크 임베딩 → 인덱싱 → 검색**

[문서] → [청크1, 청크2, 청크3] → [벡터1, 벡터2, 벡터3] → [DB저장] → [검색]

**각 단계 상세 설명:**

**1단계: 문서 분할 (Segmentation)**

- 문서를 관리 가능한 청크로 나눔
- 예: 500자 단위, 문단 단위 등

**2단계: 청크 임베딩 (Chunk Embedding)**

- 각 청크를 **인코더 모델**(예: sentence-transformers)을 사용하여 벡터 표현(vector representation)으로 변환
- 종종 **단위 크기로 정규화(normalize to unit magnitude)**: 벡터의 길이를 1로 만들어 코사인 유사도 계산을 용이하게 함

**3단계: 인덱싱 (Indexing)**

- 생성된 임베딩을 **벡터 데이터베이스**(예: Milvus, Pinecone, Chroma)에 저장
- 근사 유사성 검색(Approximate Nearest Neighbor, ANN)을 가능하게 함

**4단계: 검색 (Retrieval)**

- **코사인 유사도(cosine similarity)** 또는 유클리드 거리(Euclidean distance)를 사용
- 쿼리 임베딩과 저장된 임베딩을 비교하여 가장 관련성이 높은 청크 식별

**주요 선행 연구:**

- Lewis et al. (2020): 오픈 도메인 질의 응답에서 RAG의 효과 입증
- Karpukhin et al. (2020): Dense Passage Retrieval (DPR) 제안
- 최근 연구들: 확장성 및 임베딩 기술 발전

#### 2.2 문서 분할 기법의 발전

**분할 기법의 스펙트럼:**

```python
단순 ◄───────────────────────────────────────────────────────────► 복잡

고정 크기 분할    의미론적 분할    지도 분할 모델    Segment-then-Predict
(Fixed-size)    (Semantic)        (Supervised)         (End-to-End)
```

**1. 고정 크기 분할 (Fixed-size Segmentation)**

- 미리 정의된 문자 수나 토큰 수로 분할
- 장점: 구현 간단
- 단점: 의미 경계 무시

**2. 의미론적 분할 (Semantic Segmentation)**

- 의미 변화(shift in meaning)에 따라 의미론적 분기점(semantic breakpoints)을 감지
- 예: LlamaIndex의 SemanticChunker

**3. 지도 분할 모델 (Supervised Segmentation Models)**

- 레이블이 있는 데이터로 학습된 모델
- 문서 구조를 더 잘 이해

**4. Segment-then-Predict 모델**

- **명시적 레이블 없이 엔드 투 엔드로 훈련**
- 다운스트림 작업(downstream task, 최종 목표 작업) 성능을 위해 청킹을 최적화

**2024년의 새로운 패러다임:**

- **Late Chunking** (Jina AI)
- **Contextual Retrieval** (Anthropic)

두 기술 모두 검색 벤치마크에서 효과적인 것으로 입증되었지만, **통합된 RAG 워크플로우에서는 아직 제대로 테스트되지 않았음**. 이 연구는 이 격차를 해소하는 정도,,,?

---

### 3. 방법론 (Methodology)

#### 3.1 RQ#1: Early Chunking vs Late Chunking

#### Early Chunking (기존 방식)

**프로세스:**

1. 문서를 텍스트 청크로 **먼저** 분할
2. **각 청크가 독립적으로** 임베딩 모델에 의해 처리
3. 모델은 각 청크에 대한 토큰 수준 임베딩(token-level embeddings)을 생성
4. 평균 풀링(mean pooling)을 사용하여 집계 → 청크당 단일 임베딩 생성

**문제점:** 각 청크가 독립적으로 처리되므로 **문서 전체의 맥락 정보가 손실**됨

#### Late Chunking (새로운 방식)

**프로세스:**

1. 문서를 초기에 분할하는 대신 **전체 문서가 먼저 토큰 수준에서 임베딩**
2. 결과 토큰 임베딩들이 **나중에** 청크로 분할
3. 평균 풀링이 각 청크에 적용되어 최종 임베딩 생성

**핵심 장점:**

- 문서 내의 **전체 컨텍스트 정보를 보존**
- 다양한 검색 작업에서 더 나은 결과 가능
- **Long-context 임베딩 모델**에 적용 가능 (예: 8K, 128K 토큰 지원 모델)
- **추가 훈련 없이** 구현 가능

**차이점 요약:**

| 특성 | Early Chunking | Late Chunking |
| --- | --- | --- |
| 분할 시점 | 임베딩 **전** | 임베딩 **후** |
| 컨텍스트 범위 | 각 청크만 | 전체 문서 |
| 각 청크의 맥락 인식 | ❌ 독립적 | ✅ 전체 문서 맥락 포함 |
| 필요 모델 | 일반 임베딩 모델 | Long-context 임베딩 모델 |

#### 3.2 RQ#2: Early Chunking vs Contextual Retrieval

Contextual Retrieval은 2024년 9월 **Anthropic**에서 도입했다. 기존 RAG 프로세스에 **세 가지 단계 추가**

**클래식 RAG** : [분할] → [임베딩] → [인덱싱] → [검색] → [생성]

**Contextual Retrieval** : [분할] → **[문맥화]**→ [임베딩] → [인덱싱] →**[Rank Fusion 검색]→[Reranking]** → [생성]

#### 단계 1: Contextualization (문맥화)

**문제 상황:**

`청크: "회사의 수익은 이전 분기보다 3% 증가했습니다."`

이 청크만으로는:

- 어떤 회사인지? 모름
- 어떤 분기인지? 모름
- 전체 맥락이 무엇인지? 모름

**해결책: LLM을 사용하여 컨텍스트 생성**

[전체 문서] + [청크]

↓

[LLM에 프롬프트: "이 청크가 문서 내에서 어떤 맥락인지 설명해줘"]

↓

[생성된 컨텍스트]

↓

[컨텍스트 + 원본 청크] → [임베딩 모델] → [최종 벡터]

**예시:**

원본 청크: "회사의 수익은 이전 분기보다 3% 증가했습니다."

생성된 컨텍스트: "이 문서는 ACME Corp의 2023년 연간 보고서입니다.
이 청크는 3분기 재무 성과 섹션에 있습니다."

최종 입력: "이 문서는 ACME Corp의 2023년 연간 보고서입니다.
이 청크는 3분기 재무 성과 섹션에 있습니다.
회사의 수익은 이전 분기보다 3% 증가했습니다."

#### 단계 2: Rank Fusion (순위 융합)

**두 가지 검색 방식을 결합:**

| 검색 방식 | 특징 | 장점 | 단점 |
| --- | --- | --- | --- |
| **Dense Embedding** | 의미론적 벡터 검색 | 의미적 유사성 잘 포착 | 정확한 키워드 매칭 놓칠 수 있음 |
| **BM25 (Sparse)** | TF-IDF 기반 키워드 매칭 | 정확한 어휘 일치 | 동의어, 유사 개념 놓칠 수 있음 |

**BM25란?**
BM25는 Term Frequency-Inverse Document Frequency(TF-IDF)를 기반으로 하는 순위 함수

- **TF (Term Frequency)**: 특정 단어가 문서에 얼마나 자주 등장하는지
- **IDF (Inverse Document Frequency)**: 그 단어가 전체 문서들에서 얼마나 희귀한지

**가중치 전략:**

최종 점수 = (Dense 점수 × 1.0) + (BM25 점수 × 0.25)

→ Dense : BM25 = 4 : 1 비율
→ Anthropic의 권장 가중치

**왜 이 비율인가?**

- 초기에 1:1 비율로 테스트했을 때 검색 평가 점수가 낮았음
- Dense 임베딩에 더 높은 가중치를 주되, BM25의 기여도도 유지
- 의미론적 임베딩과 어휘 매칭의 **상호 보완적 강점** 활용

#### 단계 3: Reranking (재정렬)

**왜 Reranking이 필요한가?**

- 초기 검색은 빠르지만 정밀도가 낮을 수 있음
- 검색 단계와 랭킹 단계를 분리하여 각각 최적화

**Reranker의 작동 방식:**

[초기 검색 결과: 청크 20개]  

↓

각 (쿼리, 청크) 쌍을 Cross-Encoder에 입력 

↓

[관련성 점수 계산: 0.95, 0.87, 0.82, ...]

↓

점수 기반 재정렬

↓

[상위 5개 청크를 LLM에 전달]

**Cross-Encoder란?**

- 일반적인 **Bi-Encoder**는 쿼리와 문서를 각각 독립적으로 임베딩
- **Cross-Encoder**는 쿼리와 문서를 **함께** 입력받아 직접적인 관련성 점수 출력
- 더 정확하지만 계산 비용이 높음 → 그래서 초기 검색 후 상위 N개에만 적용

---

### 4. 실험 설정 (Experimental Setup)

#### 4.1 사용된 모델

#### 언어 모델 (LLM)

- **Microsoft Phi-3.5-mini-instruct** (4비트 양자화)
- 선택 이유: 메모리 및 컴퓨팅 제약 환경에서 효율적으로 작동
- 사용 용도:
    1. 질문 응답 작업
    2. Contextual Retrieval에서 청크 문맥화

**양자화(Quantization)란?**
모델의 가중치를 더 낮은 정밀도(예: 32비트 → 4비트)로 변환하여 **메모리 사용량과 계산 비용**을 줄이는 기법. **약간의 성능 저하가 있을 수 있지만 훨씬 가벼워짐**

#### 임베딩 모델

| 모델 | MTEB 순위 | 모델 크기(M) | 메모리(GB) | 임베딩 차원 | 최대 토큰 |
| --- | --- | --- | --- | --- | --- |
| **Stella-V5** | 5 | 1,543 | 5.75 | 1,024 | 131,072 |
| **Jina-V3** | 53 | 572 | 2.13 | 1,024 | 8,194 |
| **Jina-V2** | 123 | 137 | 0.51 | 1,024 | 8,194 |
| **BGE-M3** | 211 | 567 | 2.11 | 1,024 | 8,192 |

**MTEB (Massive Text Embedding Benchmark)란?**
임베딩 모델의 성능을 다양한 작업(검색, 분류, 클러스터링 등)에서 평가하는 표준 벤치마크. **순위가 낮을수록 좋은 성능**

#### 4.2 데이터셋

| 데이터셋 | 용도 | 특징 |
| --- | --- | --- |
| **NFCorpus** | 검색 성능 평가 | 의료 정보 검색 데이터셋, 긴 평균 문서 길이 |
| **MSMarco** | 질문 응답 생성 평가 | Microsoft의 기계 독해 데이터셋, passage 텍스트만 포함 |

**현재 RAG 평가 데이터셋의 한계:**

- 많은 데이터셋이 **검색 품질 평가 레이블**과 **답변 품질 레이블**을 함께 포함하지 않음.
- 이 논문에서는 두 가지를 별도 데이터셋으로 평가

#### 4.3 하드웨어 및 제약 사항

**사용 하드웨어:** Nvidia RTX 4090 (24GB VRAM)

**Contextual Retrieval의 GPU 메모리 문제:**

긴 문서 + 청크 → LLM 프롬프트 → VRAM 약 20GB 사용

⇒배치 크기 제한 및 처리 시간 증가

**실험 규모 제한:**

| 연구 질문 | 쿼리 수 | 문서 수 | 데이터셋 비율 |
| --- | --- | --- | --- |
| RQ#1 | 1,000 | ~5,000 | 100% |
| RQ#2 | 50 | ~300 | 20% |

RQ#2가 훨씬 적은 이유: Contextual Retrieval의 **높은 계산 요구 사항**과 하드웨어 제한 때문.

#### 4.4 분할 방식

#### 고정 크기 분할 (Fixed-size Segmentation)

- 텍스트를 **512자** 단위로 균일하게 분할
- 장점: 처리 단순화, 기준선(baseline) 제공
- 단점: 의미 경계 무시

#### 의미론적 분할 (Semantic Segmentation)

- **Jina-Segmenter API** 사용
- 텍스트의 의미 구조에 따라 청크 경계를 **동적으로 조정**
- 세그먼트가 의미 있는 콘텐츠를 캡처하여 임베딩 품질 향상

#### 동적 분할 모델 (RQ#1에서만 테스트)

| 모델 | 특징 | 처리 시간 |
| --- | --- | --- |
| **simple-qwen-0.5** | 문서의 구조적 요소(제목, 문단 등)를 기반으로 경계 식별 | 기준 대비 2배 |
| **topic-qwen-0.5** | Chain-of-Thought 추론으로 주제를 식별하여 분할 | 기준 대비 4배 |

#### 4.5 임베딩 정규화

모든 생성된 임베딩은 단위 벡터(unit vector)로 정규화

- 벡터의 크기(magnitude)를 1로 만듦
- **코사인 유사도** 계산을 용이하게 함
- 실험 전반에 걸쳐 균일성 보장

#### 4.6 검색 평가 (RQ#2)

**Milvus Vector Database 사용:**

- Dense 벡터와 BM25 Sparse 벡터 필드에서 **하이브리드 검색** 가능
- BM25EmbeddingFunction 클래스로 BM25 통합

**Reranker 모델:**

- **Jina Reranker V2 Base**
- Cross-encoder 아키텍처
- 각 (쿼리, 문서) 쌍을 개별 처리하여 관련성 점수 출력

#### 4.7 스코어링 방법

**청크 → 문서 레벨 변환:**

문서 A의 청크들: [0.95, 0.72, 0.68, 0.45]
↓
문서 A의 최종 점수: 0.95 (가장 높은 청크 점수 사용)

이 방식의 의미: 문서의 관련성은 **가장 관련성이 높은 청크**에 의해 결정됨

#### 4.8 평가 메트릭

#### NDCG (Normalized Discounted Cumulative Gain)

- 순위에서 항목의 **위치에 따라 가중치** 부여
- 목록 상단에 나타나는 항목에 더 높은 가중치
- 1위가 관련 문서인 것이 10위가 관련 문서인 것보다 훨씬 가치 있음

#### MAP (Mean Average Precision)

- 모든 쿼리에 대한 **평균 정밀도(AP)** 점수의 평균
- 관련 항목이 나타날 때마다 정밀도를 계산하여 평균
- 모델이 관련 결과를 얼마나 효과적으로 검색하는지 정량화

#### F1-score

- 정밀도(Precision)와 재현율(Recall)의 조화 평균
- 거짓 긍정(False Positive)과 거짓 부정(False Negative) 사이의 균형

---

### 5. 결과 및 분석 (Results and Analysis)

#### 5.1 Traditional Retrieval vs ContextualRankFusion

**표 2 결과 분석 (NFCorpus 20% 하위집합)**

#### 핵심 발견 1: Fixed-Window vs Semantic Chunking

| 비교 | 결과 |
| --- | --- |
| 성능 차이 | 거의 없거나 전혀 없음 |
| 구현 난이도 | Fixed-Window가 훨씬 쉽고 빠름 |
| **결론** | 복잡한 Semantic Chunking을 쓸 필요가 없을 수 있음 |

#### 핵심 발견 2: Rank Fusion + Contextualization의 효과

**Jina-V3 모델 기준 NDCG@5 비교**

| 방법 | Uncontextualized | Contextualized |
| --- | --- | --- |
| Traditional Retrieval | 0.303 | 0.312 |
| Rank Fusion + Reranking | 0.289 | **0.317** |

**왜 Contextualized + Rank Fusion이 효과적인가?**

청크: "회사의 수익은 3% 증가했다."
컨텍스트: "ACME Corp 2023년 3분기 보고서"

→ BM25가 "ACME", "2023", "3분기" 등의 키워드를 매칭
→ Dense Embedding이 의미적 유사성 포착
→ 두 가지가 결합되어 더 정확한 검색

#### 핵심 발견 3: Reranking의 중요성

**최종 Reranking 단계를 워크플로에 추가하는 것이 일관된 개선을 확인하는 데 중요**

#### 5.2 Traditional Retrieval vs Late Chunking

**표 3 결과 분석 (NFCorpus 전체)**

#### Late Chunking의 일반적 성능

대부분의 경우 Early 버전보다 **성능이 우수**

**Jina-V3, Fixed-size 512 기준:**

| 방식 | NDCG@5 | MAP@5 | F1@5 |
| --- | --- | --- | --- |
| Early | 0.374 | 0.107 | 0.186 |
| Late | **0.380** | 0.103 | 0.185 |

#### 예외 사례: Late Chunking이 더 나쁜 경우

**사례 1: BGE-M3 + NFCorpus**

| 방식 | NDCG@5 | MAP@5 | F1@5 |
| --- | --- | --- | --- |
| Early (Fix-size) | **0.246** | **0.059** | **0.120** |
| Late (Fix-size) | 0.070 | 0.010 | 0.029 |

Early가 **압도적으로** 우수!

**사례 2: Stella-V5 + MSMarco** 

| 방식 | NDCG@5 | MAP@5 |
| --- | --- | --- |
| Early | **0.630** | **0.501** |
| Late | 0.503 | 0.340 |

**시사점:**

- Late Chunking이 특정 컨텍스트에서 유망한 개선을 도입
- 그러나 **효능은 데이터셋과 모델에 따라 크게 달라짐**
- 특정 사용 사례에 따라 **검색 전략을 신중하게 선택**해야 함

#### 5.3 Late Chunking vs ContextualRankFusion

**결론:** ContextualRankFusion이 **전반적으로 더 나은 결과**를 얻음

| 방법 | NDCG@5 | MAP@5 | F1@5 | NDCG@10 | MAP@10 | F1@10 |
| --- | --- | --- | --- | --- | --- | --- |
| Late Chunking | 0.309 | 0.143 | 0.202 | 0.294 | 0.160 | 0.192 |
| **ContextualRankFusion** | **0.317** | **0.146** | **0.206** | **0.308** | **0.166** | **0.202** |

#### 5.4 동적 분할 모델

**성능 비교 (Jina-V3):**

| 분할 방식 | NDCG@5 | 처리 시간 |
| --- | --- | --- |
| Fixed-size (Early) | 0.374 | 기준 (~30분) |
| Jina-Semantic (Early) | 0.377 | 기준 |
| simple-qwen (Late) | 0.384 | 2배 (~60분) |
| topic-qwen (Late) | 0.383 | 4배 (~120분) |

**장점:**

- 동적 분할을 활용하는 파이프라인이 다른 접근 방식보다 **우수한 성능**

**단점:**

1. **더 높은 계산 요구 사항**과 더 긴 처리 시간
2. **생성적 특성으로 인한 일관성 문제**
    - 동일한 문서에 대해 항상 똑같은 청크를 생성하지 않음
    - 특정 시나리오에서 **신뢰성이 떨어짐**

---

### 6. 결론 (Conclusion)

#### 핵심 결론

**두 접근 방식 모두 context-dilemma 문제를 완화하는 데 효과적이지만, 어느 것도 결정적인 해결책은 아니다.**

#### 기술별 특성 요약

| 특성 | Late Chunking | Contextual Retrieval |
| --- | --- | --- |
| **작동 원리** | 임베딩 모델의 자연스러운 기능 활용 | LLM을 통한 컨텍스트 확대 + 재정렬 |
| **계산 효율성** | ✅ 더 효율적 | ❌ 더 높은 계산 비용 |
| **검색 성능** | 좋음 (모델/데이터에 따라 변동) | 더 좋음 (일관적) |
| **구현 복잡도** | 낮음 | 높음 |
| **필요 리소스** | Long-context 임베딩 모델 | LLM + 임베딩 모델 + Reranker |

#### 성능에 영향을 미치는 요소

1. **문서 유형과 길이**
    - 긴 문서: Contextual Retrieval의 GPU 메모리 부담 증가
    - 짧은 passage: Late Chunking의 이점 감소
2. **선택된 LLM**
    - 더 작고 효율적인 모델 → 더 나쁜 성능
    - 더 크고 강력한 모델 → 더 좋은 성능 but 더 많은 리소스
3. **임베딩 모델**
    - 모델에 따라 Early/Late 중 어느 것이 더 좋은지 달라짐

#### 실무 적용 가이드

리소스가 제한적? →`Late Chunking` 

검색 품질이 최우선? → `Contextual Retrieval` + `Reranking`

빠른 개발이 필요한가? →`Fixed-size Early Chunking`

3개 아니면 → 도메인별로 테스트 후에 결정

#### 연구의 한계점

1. **RQ#2의 제한된 실험 규모** (50 쿼리, 300 문서)
2. **단일 LLM 사용** (Phi-3.5-mini-instruct)
3. **특정 데이터셋에서만 테스트** (NFCorpus, MSMarco)
