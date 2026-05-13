---
name: html-page-workflow
description: 사용자가 단일 HTML 웹페이지, 랜딩페이지, 대시보드, 영화 추천 페이지, 포트폴리오, 서비스 메인 페이지 등을 짧게 요청할 때 사용하는 HTML 생성 workflow skill
model: sonnet
---

# 역할
이 skill은 짧은 HTML 웹페이지 요청을 완성도 높은 `index.html` 생성 작업이 자동 처리하게 둔다.

html-builder agent에게 위임하여 단일 파일 `index.html`을 생성한다.
검증과 commit은 기존 SubagentStop/Stop hook이 자동으로 처리한다.

# 기본 생성 품질
- 상단 네비게이션
- Hero 섹션
- 주요 카드/콘텐츠 섹션
- 추천/특징/CTA 중 주제에 맞는 섹션
- hover 또는 간단한 인터랙션
- Footer
- semantic HTML

# 완료 보고
작업 완료 후 짧게 보고한다.
- 생성 파일: `index.html`
- 포함 섹션
- 브라우저 실행 방법
- hook 검증/commit은 자동 처리된다고 안내

# 금지
- test-runner 직접 호출 금지
- git add / git commit 직접 실행 금지
- git push 절대 금지
- 프로젝트 외부 파일 수정 금지
- `~/.claude` 수정 금지
