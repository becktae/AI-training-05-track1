# step-workflow.md — 9단계 파이프라인 상세

## STEP 식별 테이블
| STEP | 섹션 ID | 트리거 키워드 |
|------|---------|--------------|
| STEP 1 | `#overview` | 개요, 한눈에, stat, 통계, 카드 |
| STEP 2 | `#cities` | 도시, 모달, 뉴욕, DC, 필라, 보스턴, city |
| STEP 3 | `#itinerary` | 일정, 타임라인, 아코디언, Day, 날짜 |
| STEP 4 | `#weather` | 날씨, 기온, 복장, 우산 |
| STEP 5 | `#budget` | 예산, 비용, 테이블, 금액 |
| STEP 6 | `#checklist` | 체크리스트, 준비, 체크박스, 항목 |
| STEP 7 | `#tips` | 팁, 여행팁, 꿀팁 |

---

## ① 입력 파싱
→ `refs/input-policy.md` 참조

- 대상 STEP 번호(1~7) 확정
- 변경 유형: 추가 / 수정 / 제거 / 리디자인
- 모호하면 사용자에게 확인 — 추측 금지

---

## ② PRD/TRD/TDD 확인
→ `refs/information-research-policy.md` 참조

읽어야 할 파일과 확인할 항목:
- `PRD.md` → 해당 STEP의 "목록 뷰" 표시 항목 + "클릭 시 상세 정보" 텍스트
- `TRD.md` → 해당 STEP의 인터랙션 방식 (모달/아코디언/팝오버), 외부 의존성 금지 목록, 2000줄 제한
- `TDD.md` → 해당 STEP 관련 TC(테스트 케이스) 번호와 Pass 조건

---

## ③ index.html 섹션 분석
→ `refs/information-research-policy.md` 참조

- 해당 섹션 ID(`#overview` 등) 의 현재 HTML 구조 파악
- 이미 구현된 인터랙션, 누락된 요소, PRD 대비 불일치 항목 식별
- 변경 범위를 섹션 단위로 정확히 확정

---

## ④ 정보 부족 시 Firecrawl 수집
→ `refs/information-research-policy.md` 참조

다음 조건일 때만 Firecrawl MCP를 사용한다:
- PRD.md에 정의된 텍스트 데이터가 불충분하거나 현행화가 필요할 때
- 예: 최신 Amtrak 가격, 박물관 오픈 시간 등 실시간 데이터가 필요할 때

수집 후 반드시 구조화된 요약으로 정제 — 원시 HTML 덤프 금지

---

## ⑤ page-architect-agent 구현
→ `refs/implementation-contract.md` 참조

- ②③④에서 도출한 요구사항을 포함한 지시문 작성
- page-architect-agent에 위임
- 지시문에는 변경 범위, PRD 텍스트, TRD 제약, 금지 항목 명시

---

## ⑥ validate-single-html.js 검증
→ `refs/test-contract.md` 참조

```bash
node .claude/hooks/validate-single-html.js
```

- `[VALIDATE] PASS` → ⑦로 진행
- `[VALIDATE] FAIL` → ⑧ 최소 수정 후 재검증

---

## ⑦ qa-playwright-agent 브라우저 테스트
→ `refs/test-contract.md` 참조

- TDD.md의 해당 STEP TC를 qa-playwright-agent에 전달하여 브라우저 테스트
- 모든 지정 TC `PASS` → ⑨로 진행
- `FAIL` 존재 → ⑧ 최소 수정 후 ⑥부터 재실행

---

## ⑧ 실패 시 최소 수정
→ `refs/implementation-contract.md` 참조

- FAIL 원인만 정확히 수정
- 통과한 TC에 영향을 주는 수정 금지
- 수정 후 ⑥⑦ 재실행

---

## ⑨ turn 종료 → Stop Hook auto commit
→ `refs/safety-policy.md` 참조

- 모든 검증 통과 후 turn을 종료한다
- git 명령은 실행하지 않는다
- Stop Hook이 자동으로 `session_notes.md` 기록 + `auto_commit.log` 기록 + git commit 처리
