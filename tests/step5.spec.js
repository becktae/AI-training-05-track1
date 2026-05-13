// STEP 5 — Budget 브라우저 테스트 (TC-09, TC-10)
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
    await el.waitFor({ state: 'attached', timeout: 3000 });
    const style = await el.evaluate(function (e) {
      var s = window.getComputedStyle(e);
      return { display: s.display, visibility: s.visibility, opacity: s.opacity, maxHeight: s.maxHeight, overflow: s.overflow };
    });
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
      log(`FAIL ${label}: "${text}" hidden (display:${style.display} vis:${style.visibility} op:${style.opacity})`);
      return false;
    }
    if (style.overflow === 'hidden' && style.maxHeight === '0px') {
      log(`FAIL ${label}: "${text}" max-height:0`); return false;
    }
    return true;
  } catch (e) { log(`FAIL ${label}: "${text}" not found — ${e.message}`); return false; }
}

// detail-row (display:none/table-row) textContent 확인
async function detailRowHasText(page, rowIndex, text, label) {
  try {
    const row = page.locator('#budget .detail-row').nth(rowIndex);
    const display = await row.evaluate(function (el) {
      return window.getComputedStyle(el).display;
    });
    if (display === 'none') {
      log(`FAIL ${label}: detail-row[${rowIndex}] display:none, "${text}" not visible`);
      return false;
    }
    const content = await row.textContent({ timeout: 2000 });
    if (!content.includes(text)) {
      log(`FAIL ${label}: "${text}" not found in detail-row`);
      return false;
    }
    return true;
  } catch (e) { log(`FAIL ${label}: error — ${e.message}`); return false; }
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
      results.push({ tc: name, pass, errors: consoleErrors.length });
      log(`${pass ? 'PASS' : 'FAIL'} ${name} | console errors: ${consoleErrors.length}`);
    } catch (e) {
      results.push({ tc: name, pass: false, errors: consoleErrors.length });
      log(`FAIL ${name} — exception: ${e.message}`);
    }
    await ctx.close();
  }

  // TC-09: 예산 테이블 기본 렌더링
  await runTC('TC-09', async function (page) {
    await page.locator('#budget').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const checks = [
      ['항공권', 'TC-09'],
      ['Amtrak 열차', 'TC-09'],
      ['식비', 'TC-09'],
      ['340 – 530만원', 'TC-09'],
    ];
    for (const c of checks) {
      if (!await checkVisible(page, c[0], c[1])) return false;
    }
    return true;
  });

  // TC-10-AIR: 항공권 행 클릭 → 상세 텍스트 visible
  await runTC('TC-10-AIR', async function (page) {
    await page.locator('#budget').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#budget .budget-expand-btn').nth(0).click();
    await page.waitForTimeout(300);
    for (const t of ['직항', '경유', 'JFK', 'BOS']) {
      if (!await detailRowHasText(page, 0, t, 'TC-10-AIR')) return false;
    }
    return true;
  });

  // TC-10-HOTEL: 숙박 행 클릭 → 상세 텍스트 visible
  await runTC('TC-10-HOTEL', async function (page) {
    await page.locator('#budget').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#budget .budget-expand-btn').nth(1).click();
    await page.waitForTimeout(300);
    for (const t of ['$180', '미드타운', '캐피털 힐']) {
      if (!await detailRowHasText(page, 1, t, 'TC-10-HOTEL')) return false;
    }
    return true;
  });

  // TC-10-AMTRAK: Amtrak 행 클릭 → 상세 텍스트 visible
  await runTC('TC-10-AMTRAK', async function (page) {
    await page.locator('#budget').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#budget .budget-expand-btn').nth(2).click();
    await page.waitForTimeout(300);
    for (const t of ['$30', 'amtrak.com']) {
      if (!await detailRowHasText(page, 2, t, 'TC-10-AMTRAK')) return false;
    }
    return true;
  });

  // TC-15-STEP5: 모바일 375px — 가로 스크롤 없음 + 예산 테이블 visible
  await runTC('TC-15-STEP5', async function (page) {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(200);
    const scrollWidth = await page.evaluate(function () { return document.body.scrollWidth; });
    if (scrollWidth > 375) { log('TC-15-STEP5 scrollWidth=' + scrollWidth + ' > 375'); return false; }
    await page.locator('#budget').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    if (!await checkVisible(page, '예산 계획', 'TC-15-STEP5')) return false;
    if (!await checkVisible(page, '항공권', 'TC-15-STEP5')) return false;
    return true;
  });

  await browser.close();

  const passed = results.filter(r => r.pass).length;
  const totalErrors = results.reduce((s, r) => s + r.errors, 0);
  console.log('\n========== STEP 5 결과 ==========');
  results.forEach(r => console.log((r.pass ? '✅' : '❌') + ' ' + r.tc + (r.errors ? ' (console err: ' + r.errors + ')' : '')));
  console.log(`통과: ${passed}/${results.length} | 콘솔 에러: ${totalErrors}`);
  process.exit(passed === results.length && totalErrors === 0 ? 0 : 1);
})();
