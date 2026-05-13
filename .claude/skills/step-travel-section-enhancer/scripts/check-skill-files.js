'use strict';
const fs = require('fs');
const path = require('path');

const SKILL_ROOT = path.resolve(__dirname, '..');

const REQUIRED = [
  'SKILL.md',
  'refs/step-workflow.md',
  'refs/input-policy.md',
  'refs/information-research-policy.md',
  'refs/implementation-contract.md',
  'refs/test-contract.md',
  'refs/safety-policy.md',
  'scripts/check-skill-files.js',
];

let allOk = true;
const results = REQUIRED.map(function (rel) {
  const full = path.join(SKILL_ROOT, rel);
  const exists = fs.existsSync(full);
  if (!exists) allOk = false;
  return { file: rel, ok: exists };
});

console.log('[check-skill-files] step-travel-section-enhancer 구조 검사\n');
results.forEach(function (r) {
  console.log((r.ok ? '  ✅' : '  ❌') + ' ' + r.file);
});

if (allOk) {
  console.log('\n[OK] 모든 파일이 존재합니다. 스킬을 실행할 수 있습니다.');
  process.exit(0);
} else {
  const missing = results.filter(function (r) { return !r.ok; }).map(function (r) { return r.file; });
  console.log('\n[FAIL] 누락된 파일: ' + missing.join(', '));
  console.log('누락된 파일을 생성한 뒤 다시 실행하세요.');
  process.exit(1);
}
