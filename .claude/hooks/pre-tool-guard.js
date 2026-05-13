'use strict';
const fs = require('fs');

let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch (e) { process.exit(0); }

let input = {};
try { input = JSON.parse(raw); } catch (e) { process.exit(0); }

const command = String(input.tool_input?.command || '');

const BLOCKED = [
  { re: /\bgit\s+push\b/,    msg: 'git push 금지 — Stop hook이 자동 커밋을 처리합니다.' },
  { re: /\bgit\s+reset\b/,   msg: 'git reset 금지 — 히스토리 손상 방지.' },
  { re: /\bgit\s+clean\b/,   msg: 'git clean 금지 — 파일 손실 방지.' },
  { re: /\brm\b/,            msg: 'rm 금지 — 파일 삭제는 수동으로 확인 후 진행하세요.' },
  { re: /\bdel\b/,           msg: 'del 금지.' },
  { re: /Remove-Item/,       msg: 'Remove-Item 금지.' },
];

const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
const logFile = '.claude/hooks/hook.log';

for (const { re, msg } of BLOCKED) {
  if (re.test(command)) {
    try {
      fs.appendFileSync(logFile, `[${ts}][GUARD] BLOCKED: "${command.slice(0, 80)}" — ${msg}\n`);
    } catch (_) {}

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `[GUARD] ${msg}`
      }
    }));
    process.exit(0);
  }
}

process.exit(0);
