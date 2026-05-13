# safety-policy.md — 보안·금지 명령·auto commit 정책 (파이프라인 ⑨)

## 절대 금지 명령 (pre-tool-guard.js 자동 차단 포함)

| 명령 | 이유 |
|------|------|
| `git push` | 원격 저장소 노출 방지. Stop Hook이 처리 |
| `git reset` | 히스토리 손상 방지 |
| `git clean` | 파일 손실 방지 |
| `git commit` (직접) | Stop Hook이 자동 처리. 직접 실행 금지 |
| `rm`, `del`, `Remove-Item` | 파일 삭제 방지 |
| `cat .env` / 환경변수 출력 | API Key 노출 방지 |

위 명령을 실행하면 pre-tool-guard.js가 자동 차단하고 hook.log에 기록한다.

---

## API Key 보안 규칙

- `.env` 파일의 `FIRECRAWL_API_KEY` 등 시크릿은 절대 출력하지 않는다
- 로그 파일, 콘솔, index.html에 Key 값 기록 금지
- `.mcp.json`, `.claude.json`, 코드에 Key 하드코딩 금지
- `.env`는 `.gitignore`에 포함되어 있음 — 커밋 금지

---

## ⑨ turn 종료 → Stop Hook auto commit 흐름

### 정상 흐름
1. 모든 검증 통과 (test-contract.md 7가지 조건)
2. 결과 보고 후 turn 종료
3. **Stop Hook (`stop-session.js`) 자동 실행**:
   - `session_notes.md` 에 타임스탬프 + git 상태 + 최근 커밋 기록
   - `validate-single-html.js` 재검증
   - PASS + 변경사항 있음 → `git add index.html session_notes.md auto_commit.log .claude/hooks/hook.log` → `git commit -m "auto: Claude Code generated update"`
   - FAIL → commit 스킵, `auto_commit.log`에 SKIP 사유 기록

### auto_commit.log 기록 형식
```
[YYYY-MM-DD HH:MM:SS] commit <hash> — validate PASS
[YYYY-MM-DD HH:MM:SS] SKIP — validate FAIL: <사유>
[YYYY-MM-DD HH:MM:SS] SKIP — no changes
```

### STEP 순차 실행 원칙
- 다음 STEP은 이전 STEP이 완료된 뒤 진행한다
- 이전 STEP의 7가지 완료 조건이 모두 충족되지 않으면 다음 STEP 진행 불가
- 사용자가 "STEP 2 진행해" 요청 시, STEP 1 완료 조건 확인 후 진행

---

## 스킬 실행 인터페이스

```
/step-travel-section-enhancer STEP [N] [추가 요청 내용]
```

예시:
```
/step-travel-section-enhancer STEP 1 미국 7일 5월
/step-travel-section-enhancer STEP 2 진행해
/step-travel-section-enhancer STEP 3 타임라인 아코디언 스타일 개선
```

각 STEP 완료 후 7가지 완료 조건을 모두 보고한 뒤 turn 종료한다.
