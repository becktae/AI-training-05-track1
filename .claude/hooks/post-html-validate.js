'use strict';
const fs = require('fs');
const path = require('path');
const { validate } = require('./validate-single-html.js');

let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch (e) { process.exit(0); }

let input = {};
try { input = JSON.parse(raw); } catch (e) { process.exit(0); }

const filePath = String(
  input.tool_input?.file_path ||
  input.tool_response?.filePath ||
  ''
);

if (!filePath.endsWith('index.html')) {
  process.exit(0);
}

const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
const logFile = '.claude/hooks/hook.log';

const result = validate();
const label = result.ok ? 'PASS' : `FAIL: ${result.reason}`;

try {
  fs.appendFileSync(logFile, `[${ts}][POST] validate ${label} — ${filePath}\n`);
} catch (_) {}

if (!result.ok) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `[VALIDATE] FAIL: ${result.reason}. index.html이 TRD 기준을 통과하지 못했습니다. 바로 수정하세요.`
    }
  }));
}

process.exit(0);
