// STEP 1 — Overview 브라우저 테스트 (TC-00, TC-01, TC-02, TC-15)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const HTML_PATH = 'file://' + path.resolve(__dirname, '../index.html');
const LOG_FILE  = path.resolve(__dirname, '../.claude/hooks/hook.log');

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  try { fs.appendFileSync(LOG_FILE, `[${ts}][TEST] ${msg}\n`); } catch (_) {}
  console.log(`[TEST] ${msg}`);
}

async function checkVisible(page, text, label) {
  try {
    const el = page.getByText(text, { exact: false }).first();
    const box = await el.boundingBox();
    if (!box) { log(`FAIL ${label}: "${text}" boundingBox null`); return false; }
    const style = await el.evaluate(function (e) {
      var s = window.getComputedStyle(e);
      return { display: s.display, visibility: s.visibility, opacity: s.opacity, maxHeight: s.maxHeight, overflow: s.overflow };
    });
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
      log(`FAIL ${label}: "${text}" hidden by style`); return false;
    }
    if (style.overflow === 'hidden' && style.maxHeight === '0px') {
      log(`FAIL ${label}: "${text}" max-height:0`); return false;
    }
    return true;
  } catch (e) { log(`FAIL ${label}: "${text}" error — ${e.message}`); return false; }
}

(async function () {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  async function runTC(name, fn) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', function (msg) { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    await page.goto(HTML_PATH, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    try {
      const pass = await fn(page);
      results.push({ tc: name, pass: pass, errors: consoleErrors.length });
      log(`${pass ? 'PASS' : 'FAIL'} ${name} | console errors: ${consoleErrors.length}`);
    } catch (e) {
      results.push({ tc: name, pass: false, errors: consoleErrors.length });
      log(`FAIL ${name} — exception: ${e.message}`);
    }
    await ctx.close();
  }

  // TC-00: 페이지 기본 로드
  await runTC('TC-00', async function (page) {
    const title = await page.title();
    if (!title.includes('5월')) { log('TC-00 title missing "5월"'); return false; }
    const checks = [
      ['2025년 5월 10일', 'TC-00'],
      ['5월 16일', 'TC-00'],
      ['뉴욕', 'TC-00'],
      ['워싱턴', 'TC-00'],
      ['필라델피아', 'TC-00'],
      ['보스턴', 'TC-00'],
    ];
    for (var c of checks) { if (!await checkVisible(page, c[0], c[1])) return false; }
    const navLinks = await page.locator('.nav-links a').count();
    if (navLinks < 7) { log('TC-00 nav links < 7'); return false; }
    return true;
  });

  // TC-01: stat 카드 6개 기본 렌더링
  await runTC('TC-01', async function (page) {
    const texts = [
      ['7', 'TC-01-7일'],
      ['ESTA', 'TC-01-ESTA'],
      ['18', 'TC-01-18°C'],
      ['무료', 'TC-01-무료'],
      ['Amtrak', 'TC-01-Amtrak'],
    ];
    for (var t of texts) { if (!await checkVisible(page, t[0], t[1])) return false; }
    const cards = await page.locator('button.stat-card').count();
    if (cards < 6) { log('TC-01 stat cards < 6 (found ' + cards + ')'); return false; }
    return true;
  });

  // TC-02: 7일 카드 클릭 → 상세 텍스트 visible
  await runTC('TC-02', async function (page) {
    // 7일 카드 클릭
    await page.locator('button.stat-card').first().click();
    await page.waitForTimeout(400);
    var checks1 = [
      ['2025년 5월 10일', 'TC-02-7일카드'],
      ['5월 16일', 'TC-02-7일카드'],
      ['비행 포함', 'TC-02-7일카드'],
    ];
    for (var c of checks1) { if (!await checkVisible(page, c[0], c[1])) return false; }

    // 4개 도시 카드 클릭 (두 번째)
    await page.locator('button.stat-card').nth(1).click();
    await page.waitForTimeout(400);
    var checks2 = [
      ['뉴욕(2박)', 'TC-02-도시카드'],
      ['워싱턴 D.C.(2박)', 'TC-02-도시카드'],
      ['필라델피아(1박)', 'TC-02-도시카드'],
      ['보스턴(귀국)', 'TC-02-도시카드'],
    ];
    for (var c of checks2) { if (!await checkVisible(page, c[0], c[1])) return false; }
    return true;
  });

  // TC-15: 모바일 375px 가로 스크롤 없음
  await runTC('TC-15', async function (page) {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(200);
    var scrollWidth = await page.evaluate(function () { return document.body.scrollWidth; });
    if (scrollWidth > 375) { log('TC-15 scrollWidth=' + scrollWidth + ' > 375'); return false; }
    var visChecks = [['5월 미국', 'TC-15'], ['D1', 'TC-15'], ['7', 'TC-15']];
    for (var c of visChecks) { if (!await checkVisible(page, c[0], c[1])) return false; }
    return true;
  });

  await browser.close();

  // 결과 집계
  var passed = results.filter(function (r) { return r.pass; }).length;
  var totalErrors = results.reduce(function (s, r) { return s + r.errors; }, 0);
  console.log('\n========== STEP 1 결과 ==========');
  results.forEach(function (r) { console.log((r.pass ? '✅' : '❌') + ' ' + r.tc + (r.errors ? ' (console err: ' + r.errors + ')' : '')); });
  console.log(`통과: ${passed}/${results.length} | 콘솔 에러: ${totalErrors}`);
  process.exit(passed === results.length && totalErrors === 0 ? 0 : 1);
})();
