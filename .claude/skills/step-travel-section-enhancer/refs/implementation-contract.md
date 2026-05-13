# implementation-contract.md — 구현 제약 조건 (파이프라인 ⑤⑧)

## 우선순위 원칙
> 사용자의 현재 STEP 요청이 PRD/TRD/TDD보다 우선한다.
> 단, 아래 **절대 규칙**은 사용자 요청으로도 override 불가하다.

---

## 절대 규칙 (모든 Skill·Agent 공통 — 예외 없음)

| 규칙 | 설명 |
|------|------|
| 단일 index.html 유지 | 외부 `.css`, `.js` 파일 생성 금지. HTML·CSS·JS 전부 index.html 안에 |
| API Key·.env·토큰 출력 금지 | 로그, 콘솔, 화면에 절대 노출 금지 |
| 외부 CDN/assets 추가 금지 | `<script src="https://...">`, `<link href="https://...">`, Google Fonts, Font Awesome 등 |
| React/Vite/Next.js/npm 전환 금지 | 순수 Vanilla JS (ES2020 이하)만 허용 |
| git push/reset/clean/파일 삭제 금지 | pre-tool-guard.js가 자동 차단 |
| 직접 git commit 금지 | Stop Hook이 자동 처리. 직접 commit 명령 실행 금지 |

---

## ⑤ page-architect-agent 위임 지시문 형식

```
대상: index.html의 [섹션 ID] 섹션 (STEP N)

요구사항:
[사용자 요청 내용 — 구체적으로 기술]
[PRD.md에서 확인한 클릭 시 상세 정보 텍스트]
[TRD.md에서 확인한 인터랙션 구현 방식]

준수 사항:
- 해당 섹션 외 수정 금지
- button 또는 a 요소에만 click 이벤트 부여 (div 클릭 금지)
- aria-expanded, aria-label 접근성 속성 유지
- max-height 트랜지션으로 accordion 구현
- 2000줄 이하 유지
- 모바일 375px 가로 스크롤 없음 확인

절대 금지:
- CDN 외부 의존성 추가
- 외부 파일 생성
- git 명령 실행
- API Key 출력
```

---

## 구현 품질 기준 (TRD 요약)

### HTML
- `<button>` 또는 `<a>`에만 click 이벤트
- `aria-expanded="true/false"` 토글 필수
- `aria-label` 모달 닫기 버튼 등에 명시

### 모달 (STEP 2 Cities)
- `<dialog>` 요소 사용
- ESC 키 닫기, 배경 클릭 닫기, 닫기 버튼(×) 필수
- 열릴 때 `document.body.style.overflow = 'hidden'`
- 닫힐 때 `document.body.style.overflow = ''`

### Accordion
- `max-height: 0` → `max-height: <값>` CSS transition
- `aria-expanded` 토글
- 필요 시 한 번에 하나만 열리도록 처리

### CSS
- CSS 변수(`var(--navy)` 등) 활용
- 반응형: 640px 이하, 1024px 이하 대응
- 375px 가로 스크롤 없음

---

## ⑧ 실패 시 최소 수정 원칙

- validate-single-html.js 또는 qa-playwright-agent 실패 시
- **FAIL 원인만** 정확히 수정한다
- 통과한 TC에 영향을 주는 추가 변경 금지
- 수정 후 ⑥⑦을 다시 실행한다
- 2회 연속 FAIL 시 사용자에게 원인을 보고하고 대기한다
