'use strict';
const fs = require('fs');
const { execSync } = require('child_process');
const { validate } = require('./validate-single-html.js');

const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);

const HOOK_LOG      = '.claude/hooks/hook.log';
const AUTO_LOG      = 'auto_commit.log';
const SESSION_NOTES = 'session_notes.md';

function appendLog(file, line) {
  try { fs.appendFileSync(file, line + '\n'); } catch (_) {}
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (_) { return ''; }
}

// ── 1. session_notes.md 기록 ────────────────────────────────────────────────
const gitStatus  = run('git status --short') || '(변경사항 없음)';
const recentLogs = run('git log --oneline -5') || '(커밋 없음)';

const noteBlock = [
  '',
  `## 세션 — ${ts}`,
  '',
  '### 변경 파일',
  '```',
  gitStatus,
  '```',
  '',
  '### 최근 커밋',
  '```',
  recentLogs,
  '```',
  '',
  '---',
].join('\n');

try { fs.appendFileSync(SESSION_NOTES, noteBlock + '\n'); } catch (_) {}

// ── 2. hook.log 기록 ────────────────────────────────────────────────────────
appendLog(HOOK_LOG, `[${ts}][HOOK] Stop hook started`);

// ── 3. index.html 검증 ──────────────────────────────────────────────────────
const result = validate();
const label  = result.ok ? 'PASS' : `FAIL: ${result.reason}`;
appendLog(HOOK_LOG, `[${ts}][HOOK] validate ${label}`);

if (!result.ok) {
  appendLog(AUTO_LOG, `[${ts}] SKIP — validate ${label}`);
  process.exit(0);
}

// ── 4. 변경사항 확인 ─────────────────────────────────────────────────────────
const porcelain = run('git status --porcelain');
if (!porcelain) {
  appendLog(HOOK_LOG, `[${ts}][HOOK] no changes — commit skip`);
  appendLog(AUTO_LOG, `[${ts}] SKIP — no changes`);
  process.exit(0);
}

// ── 5. 커밋 (index.html + 로그 파일) ─────────────────────────────────────────
run('git add index.html session_notes.md auto_commit.log .claude/hooks/hook.log');

const commitOut = run('git commit -m "auto: Claude Code generated update"');
if (!commitOut) {
  appendLog(AUTO_LOG, `[${ts}] SKIP — nothing to commit after add`);
  process.exit(0);
}

const hash = run('git log -1 --format=%h');
appendLog(HOOK_LOG, `[${ts}][HOOK] commit success: ${hash}`);
appendLog(AUTO_LOG, `[${ts}] commit ${hash} — validate PASS`);

process.exit(0);
