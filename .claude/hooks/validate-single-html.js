'use strict';
const fs = require('fs');
const path = require('path');

function validate(htmlPath) {
  htmlPath = htmlPath || path.resolve(process.cwd(), 'index.html');

  if (!fs.existsSync(htmlPath)) {
    return { ok: false, reason: 'index.html not found' };
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  const checks = [
    { name: 'DOCTYPE',           pass: /<!DOCTYPE\s+html>/i.test(html) },
    { name: '<html> tag',        pass: /<html/i.test(html) },
    { name: '<head> tag',        pass: /<head/i.test(html) },
    { name: '<body> tag',        pass: /<body/i.test(html) },
    { name: 'viewport meta',     pass: /name=["']viewport["']/i.test(html) },
    { name: '<style> block',     pass: /<style[\s>]/i.test(html) },
    { name: 'no CDN script src', pass: !/<script[^>]+src=["']https?:/i.test(html) },
    { name: 'no CDN stylesheet', pass: !/<link[^>]+href=["']https?:/i.test(html) },
    { name: 'no cdn domain',     pass: !/cdn\.|unpkg\.|jsdelivr\./i.test(html) },
  ];

  const failed = checks.filter(c => !c.pass).map(c => c.name);
  if (failed.length > 0) {
    return { ok: false, reason: failed.join(', ') };
  }
  return { ok: true };
}

module.exports = { validate };

if (require.main === module) {
  const result = validate();
  const label = result.ok ? 'PASS' : `FAIL: ${result.reason}`;
  console.log(`[VALIDATE] ${label}`);
  process.exit(result.ok ? 0 : 1);
}
