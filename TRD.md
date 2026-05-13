# TRD — 기술 요구사항 정의서

## 1. 단일 파일 원칙

### 1.1 구조
- **유일한 산출물**: `index.html` 단일 파일
- HTML · CSS · JavaScript 전부 `index.html` 안에 작성
- CSS는 `<head>` 안의 `<style>` 블록에 작성
- JS는 `</body>` 직전의 `<script>` 블록에 작성 (즉시 실행 함수 IIFE로 래핑)
- 외부 파일 분리(`style.css`, `app.js` 등) 금지

### 1.2 파일 크기 기준
- 단일 `index.html` 권장 크기: 2,000라인 이하
- 초과 시 불필요한 중복 제거 후 유지 (파일 분리는 허용하지 않음)

---

## 2. 외부 의존성 금지

### 2.1 절대 사용 금지 목록
| 분류 | 금지 항목 |
|------|-----------|
| CDN 스크립트 | `<script src="https://...">` 형태 전부 |
| CDN 스타일시트 | `<link rel="stylesheet" href="https://...">` 전부 |
| 외부 폰트 | Google Fonts, Adobe Fonts (`@import url(...)`) |
| 외부 아이콘 | Font Awesome, Bootstrap Icons CDN |
| JS 프레임워크 | React, Vue, Angular, Svelte |
| 빌드 도구 | Vite, Next.js, Nuxt, Create React App, Webpack |
| 패키지 매니저 | npm install, yarn add (런타임 의존성) |
| 외부 이미지 URL | `<img src="https://...">` (base64 인라인은 허용) |

### 2.2 허용 범위
- `<script>` 내 순수 Vanilla JS (ES2020 이하)
- CSS 변수, Flexbox, Grid, `@media` 쿼리
- Web API: `IntersectionObserver`, `localStorage`, `fetch` (단, 내부 데이터 조작 목적)
- Unicode 이모지 (별도 폰트 불필요)
- 시스템 폰트 스택: `system-ui, -apple-system, 'Segoe UI', ...`

---

## 3. HTML 품질 기준

### 3.1 필수 요소
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>...</title>
  <style>...</style>
</head>
<body>
  ...
  <script>...</script>
</body>
</html>
```

### 3.2 Semantic HTML
- 구조: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` 사용
- 제목 계층: `<h1>` 1개, `<h2>` 섹션당 1개, `<h3>` 카드 제목
- 인터랙션: `<button>` 또는 `<a>`에만 클릭 이벤트 부여 (div 클릭 금지)
- 접근성: `aria-expanded`, `aria-label`, `role` 필요 시 명시

### 3.3 반응형
- 모바일 기준점: 640px 이하
- 태블릿 기준점: 1024px 이하
- 레이아웃 붕괴 없이 320px 너비까지 지원

---

## 4. 인터랙션 구현 방식

### 4.1 STEP별 상세 정보 표시 방식
| STEP | 기본 방식 | 대체 방식 |
|------|-----------|-----------|
| STEP 1 Overview | `data-detail` 속성 팝오버 | 카드 하단 슬라이드 확장 |
| STEP 2 Cities | 모달 (`dialog` 또는 div 오버레이) | 카드 플립 |
| STEP 3 Itinerary | 카드 accordion (max-height 트랜지션) | 인라인 확장 |
| STEP 4 Weather | 카드 하단 확장 | 팝오버 |
| STEP 5 Budget | 테이블 행 확장 (`<tr>` 토글) | 사이드 패널 |
| STEP 6 Checklist | localStorage 체크 상태 + 인라인 팁 | — |
| STEP 7 Tips | 카드 accordion | 모달 |

### 4.2 모달 구현 규칙
- `<dialog>` 요소 사용 권장 (또는 `position: fixed` overlay div)
- ESC 키 닫기 구현 필수
- 배경 클릭으로 닫기 구현 필수
- 모달 열림 시 `document.body` scroll lock (`overflow: hidden`)
- 닫기 버튼(`×`) 반드시 포함

### 4.3 Accordion 구현 규칙
- `max-height: 0` → `max-height: <content height>` CSS transition
- `aria-expanded="true/false"` 토글 필수
- 한 번에 하나만 열리는 방식 또는 복수 열림 방식 중 STEP에 맞게 선택

---

## 5. Subagent 사용 정책

### 5.1 html-builder agent
- 역할: `index.html` 생성·수정 전담
- 진입점: 사용자 HTML 생성 요청 → `html-page-workflow` skill → `html-builder` agent
- 금지: git 명령, 외부 파일 생성, npm 설치

### 5.2 test-runner agent
- 역할: `SubagentStop` hook에서 `html-builder` 종료 후 자동 검증
- 검증 기준: `.claude/agents/test-runner.md` 참조
- 출력: `{ "ok": true }` 또는 `{ "ok": false, "reason": "..." }`

---

## 6. MCP 사용 정책

| MCP 서버 | 허용 용도 | 금지 용도 |
|----------|-----------|-----------|
| `playwright-mcp` | `index.html` E2E 테스트, 렌더링 검증 | 프로덕션 배포 자동화 |
| `context7` | HTML/CSS/JS/Playwright API 문서 조회 | 외부 CDN 라이브러리 도입 근거로 사용 |
| `sequential-thinking` | 복잡한 UI 설계 단계 분해, 인터랙션 설계 검토 | 최종 결과물 생성 (설계 보조만 허용) |
| `firecrawl-mcp` | 여행 정보 크롤링, 가격 데이터 수집 | 개인정보 수집, 로그인 세션 필요 사이트 |

### 6.1 firecrawl API Key 보안
- Key는 `.env` 파일에서만 읽는다
- `.claude.json`, `.mcp.json`, 코드에 직접 하드코딩 금지
- Key 값 출력 및 로그 기록 금지
- `.env`는 `.gitignore`에 포함 — 커밋 금지

---

## 7. Hook 실행 정책

### 7.1 SubagentStop Hook
- 트리거: `html-builder` agent 종료 시
- 동작: `test-runner` agent 실행 → `index.html` 품질 검증
- 검증 통과 시: `{ "ok": true }` 반환, 이후 작업 계속
- 검증 실패 시: `{ "ok": false, "reason": "..." }` 반환, `.claude/hooks/hook.log`에 기록

### 7.2 Stop Hook
- 트리거: Claude Code 세션 종료 시
- 동작: `stop-test-and-commit.ps1` 실행 (PowerShell Core)
- 테스트 통과 + 변경사항 존재: `git add .` → `git commit -m "auto: Claude Code generated update"`
- 테스트 실패: 커밋 금지, 실패 이유 `hook.log`에 기록
- **`git push` 절대 실행 금지**

### 7.3 hook.log 형식
```
[YYYY-MM-DD HH:MM:SS][HOOK] SubagentStop test-runner validation started
[YYYY-MM-DD HH:MM:SS][HOOK] test passed
[YYYY-MM-DD HH:MM:SS][HOOK] commit success: <hash>
```

---

## 8. 브라우저 호환성
- 최신 Chrome, Firefox, Safari, Edge
- IE 지원 불필요
- `IntersectionObserver`, CSS Grid, CSS Custom Properties 사용 가능
