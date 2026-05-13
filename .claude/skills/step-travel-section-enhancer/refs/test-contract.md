# test-contract.md — 검증 기준 및 완료 조건 (파이프라인 ⑥⑦)

## STEP 완료 조건 — 7가지 전부 충족해야 완료

```
✅ 1. index.html 해당 STEP 섹션 수정 완료
✅ 2. validate-single-html.js PASS
✅ 3. Playwright 브라우저 테스트 PASS
✅ 4. 콘솔 에러 0건
✅ 5. 모바일 375px 가로 스크롤 없음
✅ 6. .claude/hooks/hook.log 기록됨
✅ 7. session_notes.md 기록 + auto_commit.log에 COMMITTED 또는 명확한 SKIP 사유
```

하나라도 미충족 시 완료로 보고하지 않는다.

---

## ⑥ validate-single-html.js 검증

### 실행 명령
```bash
node .claude/hooks/validate-single-html.js
```

### 통과 기준 (9개 체크)
| 항목 | 조건 |
|------|------|
| DOCTYPE | `<!DOCTYPE html>` 존재 |
| `<html>` 태그 | 존재 |
| `<head>` 태그 | 존재 |
| `<body>` 태그 | 존재 |
| viewport meta | `name="viewport"` 존재 |
| `<style>` 블록 | 존재 |
| CDN script src 없음 | `<script src="https://...">` 없음 |
| CDN stylesheet 없음 | `<link href="https://...">` 없음 |
| cdn 도메인 없음 | `cdn.`, `unpkg.`, `jsdelivr.` 없음 |

### FAIL 처리
- FAIL 항목 확인 → ⑧ 최소 수정 → 재실행
- 재실행 후에도 FAIL → 사용자에게 원인 보고

---

## ⑦ qa-playwright-agent 브라우저 테스트

### 테스트 범위
- TDD.md에서 해당 STEP 관련 TC 번호 추출
- qa-playwright-agent에 TC 목록과 index.html 경로 전달

### visible 판정 기준 (TDD.md 기준)
다음 조건 중 하나라도 해당되면 **not visible** 판정:
- `display: none`
- `visibility: hidden`
- `opacity: 0`
- `max-height: 0` + `overflow: hidden`
- viewport 밖에 위치

### 추가 확인 항목
- **콘솔 에러 0건**: `console.error` 또는 JS 오류 없음
- **모바일 375px 가로 스크롤 없음**: `document.body.scrollWidth <= 375`

### FAIL 처리
- 실패한 TC 번호와 원인 기록
- ⑧ 최소 수정 후 ⑥부터 재실행
- 2회 연속 FAIL → 사용자에게 보고 및 대기

---

## 완료 보고 형식

```
## STEP [N] 완료 보고

- 섹션: #[섹션ID]
- 변경 내용:
  - [변경 항목 1]
  - [변경 항목 2]

### 검증 결과
| 항목 | 결과 |
|------|------|
| validate-single-html.js | PASS |
| Playwright TC ([TC 번호]) | PASS |
| 콘솔 에러 | 0건 |
| 모바일 375px 스크롤 | 없음 |
| hook.log 기록 | ✅ |
| auto_commit.log | COMMITTED [hash] |
```
