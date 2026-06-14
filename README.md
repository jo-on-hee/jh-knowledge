# 준희의 지식 베이스

공부하고 정리한 것들을 주제별로 쌓아두는 개인 지식 베이스.

사이트: https://jo-on-hee.github.io/jh-knowledge/

## 주제

- **Hermes 에이전트 뜯어보기** — 오픈소스 AI 에이전트 Hermes의 내부 구조를 코드 기준으로 분해한 14편 시리즈.

## 구조

```
docs/                 지식 베이스 본문 (.md)
  hermes-agent/       주제별 폴더 (_category_.json + .md)
src/css/custom.css    디자인 커스텀
docusaurus.config.ts  사이트 설정
```

## 로컬에서 보기

```bash
npm install
npm run build && npm run serve   # http://localhost:3000
```

## 새 주제 추가

`docs/` 아래에 폴더를 만들고 `_category_.json` + `.md` 파일을 넣으면 사이드바에 자동 반영된다.

## 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드·배포한다.

---

[Docusaurus](https://docusaurus.io/)로 제작.
