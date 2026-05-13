---
name: step-travel-section-enhancer
description: 사용자가 "STEP N 개선", "날씨 섹션 고쳐줘", "체크리스트 업그레이드" 같이 index.html의 특정 섹션(STEP 1~7)을 수정·강화 요청할 때 사용하는 skill. 입력 파싱 → PRD/TRD/TDD 확인 → 섹션 분석 → Firecrawl 보강 → page-architect-agent 구현 → 검증 → 브라우저 테스트 → 수정 → Stop Hook auto commit 순서로 처리한다.
model: sonnet
---

# 역할
index.html의 특정 STEP 섹션을 PRD/TRD/TDD 기준으로 개선한다.
모든 단계는 아래 refs 문서를 읽고 준수한다.

# 처리 파이프라인 (9단계 고정)

```
① 입력 파싱          → refs/input-policy.md
② PRD/TRD/TDD 확인   → refs/information-research-policy.md
③ 섹션 분석          → refs/information-research-policy.md
④ Firecrawl 수집     → refs/information-research-policy.md (정보 부족 시)
⑤ 구현              → refs/implementation-contract.md (page-architect-agent)
⑥ HTML 검증         → refs/test-contract.md (validate-single-html.js)
⑦ 브라우저 테스트    → refs/test-contract.md (qa-playwright-agent)
⑧ 실패 시 최소 수정  → refs/implementation-contract.md
⑨ turn 종료         → refs/safety-policy.md (Stop Hook auto commit)
```

# 참조 문서
| 파일 | 담당 단계 |
|------|----------|
| `refs/input-policy.md` | ① 입력 파싱·검증 규칙 |
| `refs/information-research-policy.md` | ②③④ PRD/TRD/TDD 독해 + Firecrawl 수집 정책 |
| `refs/implementation-contract.md` | ⑤⑧ page-architect-agent 위임 제약 + 수정 규칙 |
| `refs/test-contract.md` | ⑥⑦ HTML 검증 + 브라우저 테스트 기준 |
| `refs/safety-policy.md` | ⑨ 금지 명령·보안·auto commit 안내 |

# 실행 전 체크
```
node .claude/skills/step-travel-section-enhancer/scripts/check-skill-files.js
```
refs 파일이 하나라도 없으면 실행을 중단하고 사용자에게 알린다.

# 완료 보고 형식
- 수정 STEP 및 섹션 ID
- 변경 내용 (추가·수정·제거 기능)
- HTML 검증 결과 (validate-single-html.js)
- 브라우저 테스트 결과 (qa-playwright-agent)
- Stop Hook auto commit 완료 안내
