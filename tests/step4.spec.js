// STEP 4 — Weather 브라우저 테스트 (TC-07, TC-08)
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

// detail body(max-height 방식) textContent 확인
async function detailHasText(page, bodyLocator, text, label) {
  try {
    const maxH = await bodyLocator.evaluate(function (el) {
      return window.getComputedStyle(el).maxHeight;
    });
    if (maxH === '0px') {
      log(`FAIL ${label}: detail body closed, "${text}" not visible`);
      return false;
    }
    const content = await bodyLocator.textContent({ timeout: 2000 });
    if (!content.includes(text)) {
      log(`FAIL ${label}: "${text}" not found in detail body`);
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

  // TC-07: 날씨 카드 기본 렌더링
  await runTC('TC-07', async function (page) {
    await page.locator('#weather').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const checks = [
      ['14 – 22°C', 'TC-07'],
      ['16 – 26°C', 'TC-07'],
      ['14 – 24°C', 'TC-07'],
      ['12 – 20°C', 'TC-07'],
    ];
    for (const c of checks) {
      if (!await checkVisible(page, c[0], c[1])) return false;
    }
    return true;
  });

  // TC-08-NY: 뉴욕 날씨 카드 클릭 → 상세 텍스트 visible
  await runTC('TC-08-NY', async function (page) {
    await page.locator('#weather .weather-card').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#weather .weather-expand-btn').first().click();
    await page.waitForTimeout(400);
    const body = page.locator('#weather .weather-detail-body').first();
    for (const t of ['라일락', '레이어링', '우산']) {
      if (!await detailHasText(page, body, t, 'TC-08-NY')) return false;
    }
    return true;
  });

  // TC-08-BOS: 보스턴 날씨 카드 클릭 → 상세 텍스트 visible
  await runTC('TC-08-BOS', async function (page) {
    await page.locator('#weather .weather-card').last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#weather .weather-expand-btn').last().click();
    await page.waitForTimeout(400);
    const body = page.locator('#weather .weather-detail-body').last();
    for (const t of ['찰스강', '바람막이', 'Boston Marathon']) {
      if (!await detailHasText(page, body, t, 'TC-08-BOS')) return false;
    }
    return true;
  });

  // TC-15-STEP4: 모바일 375px — 가로 스크롤 없음 + 날씨 visible
  await runTC('TC-15-STEP4', async function (page) {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(200);
    const scrollWidth = await page.evaluate(function () { return document.body.scrollWidth; });
    if (scrollWidth > 375) { log('TC-15-STEP4 scrollWidth=' + scrollWidth + ' > 375'); return false; }
    await page.locator('#weather').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    if (!await checkVisible(page, '5월 날씨', 'TC-15-STEP4')) return false;
    if (!await checkVisible(page, '14 – 22°C', 'TC-15-STEP4')) return false;
    return true;
  });

  await browser.close();

  const passed = results.filter(r => r.pass).length;
  const totalErrors = results.reduce((s, r) => s + r.errors, 0);
  console.log('\n========== STEP 4 결과 ==========');
  results.forEach(r => console.log((r.pass ? '✅' : '❌') + ' ' + r.tc + (r.errors ? ' (console err: ' + r.errors + ')' : '')));
  console.log(`통과: ${passed}/${results.length} | 콘솔 에러: ${totalErrors}`);
  process.exit(passed === results.length && totalErrors === 0 ? 0 : 1);
})();
