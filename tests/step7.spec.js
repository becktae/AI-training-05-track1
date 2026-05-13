// STEP 7 — Tips 브라우저 테스트 (TC-13, TC-14)
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

// tip-detail-body (max-height 방식) textContent 확인
async function tipDetailHasText(page, bodyLocator, text, label) {
  try {
    const maxH = await bodyLocator.evaluate(function (el) {
      return window.getComputedStyle(el).maxHeight;
    });
    if (maxH === '0px') {
      log(`FAIL ${label}: tip-detail-body closed, "${text}" not visible`);
      return false;
    }
    const content = await bodyLocator.textContent({ timeout: 2000 });
    if (!content.includes(text)) {
      log(`FAIL ${label}: "${text}" not found in tip-detail-body`);
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

  // TC-13: 팁 카드 기본 렌더링
  await runTC('TC-13', async function (page) {
    await page.locator('#tips').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const checks = [
      ['Amtrak 예약', 'TC-13'],
      ['D.C. 박물관은 전부 무료', 'TC-13'],
      ['팁은 15~20%', 'TC-13'],
      ['로브스터 롤', 'TC-13'],
      ['eSIM', 'TC-13'],
      ['Memorial Day', 'TC-13'],
    ];
    for (const c of checks) {
      if (!await checkVisible(page, c[0], c[1])) return false;
    }
    const cards = await page.locator('#tips button.tip-card').count();
    if (cards < 6) { log('TC-13 tip-card < 6 (found ' + cards + ')'); return false; }
    return true;
  });

  // TC-14-AMTRAK: Amtrak 팁 카드 클릭 → 상세 텍스트 visible
  await runTC('TC-14-AMTRAK', async function (page) {
    await page.locator('#tips button.tip-card').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#tips button.tip-card').first().click();
    await page.waitForTimeout(400);
    const body = page.locator('#tips button.tip-card').first().locator('.tip-detail-body');
    for (const t of ['Acela', '$150', 'Northeast Regional', '30~40분']) {
      if (!await tipDetailHasText(page, body, t, 'TC-14-AMTRAK')) return false;
    }
    return true;
  });

  // TC-14-LOBSTER: 로브스터 롤 팁 카드 클릭 → 상세 텍스트 visible
  await runTC('TC-14-LOBSTER', async function (page) {
    // 로브스터 롤 카드 = 4번째 (index 3)
    await page.locator('#tips button.tip-card').nth(3).scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#tips button.tip-card').nth(3).click();
    await page.waitForTimeout(400);
    const body = page.locator('#tips button.tip-card').nth(3).locator('.tip-detail-body');
    for (const t of ['James Hook', "Luke's Lobster", '$28']) {
      if (!await tipDetailHasText(page, body, t, 'TC-14-LOBSTER')) return false;
    }
    return true;
  });

  // TC-15-STEP7: 모바일 375px — 가로 스크롤 없음 + 팁 카드 visible
  await runTC('TC-15-STEP7', async function (page) {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(200);
    const scrollWidth = await page.evaluate(function () { return document.body.scrollWidth; });
    if (scrollWidth > 375) { log('TC-15-STEP7 scrollWidth=' + scrollWidth + ' > 375'); return false; }
    await page.locator('#tips').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    if (!await checkVisible(page, '여행 팁', 'TC-15-STEP7')) return false;
    if (!await checkVisible(page, 'Amtrak 예약', 'TC-15-STEP7')) return false;
    return true;
  });

  await browser.close();

  const passed = results.filter(r => r.pass).length;
  const totalErrors = results.reduce((s, r) => s + r.errors, 0);
  console.log('\n========== STEP 7 결과 ==========');
  results.forEach(r => console.log((r.pass ? '✅' : '❌') + ' ' + r.tc + (r.errors ? ' (console err: ' + r.errors + ')' : '')));
  console.log(`통과: ${passed}/${results.length} | 콘솔 에러: ${totalErrors}`);
  process.exit(passed === results.length && totalErrors === 0 ? 0 : 1);
})();
