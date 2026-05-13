// STEP 6 — Checklist 브라우저 테스트 (TC-11, TC-12)
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

// item-tip (max-height 방식) textContent 확인
async function tipHasText(page, tipId, text, label) {
  try {
    const tip = page.locator('#' + tipId);
    const maxH = await tip.evaluate(function (el) {
      return window.getComputedStyle(el).maxHeight;
    });
    if (maxH === '0px') {
      log(`FAIL ${label}: tip#${tipId} closed, "${text}" not visible`);
      return false;
    }
    const content = await tip.textContent({ timeout: 2000 });
    if (!content.includes(text)) {
      log(`FAIL ${label}: "${text}" not found in tip#${tipId}`);
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

  // TC-11: 체크리스트 항목 렌더링
  await runTC('TC-11', async function (page) {
    await page.locator('#checklist').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const checks = [
      ['필수 서류', 'TC-11'],
      ['ESTA', 'TC-11'],
      ['교통 예약', 'TC-11'],
      ['Amtrak', 'TC-11'],
      ['관광 예약', 'TC-11'],
      ['자유의 여신상', 'TC-11'],
    ];
    for (const c of checks) {
      if (!await checkVisible(page, c[0], c[1])) return false;
    }
    return true;
  });

  // TC-12: ESTA 체크박스 클릭 → checked + 팁 버튼 클릭 → 팁 텍스트 visible
  await runTC('TC-12', async function (page) {
    await page.locator('#checklist').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    // ESTA 체크박스 클릭
    const estaCheckbox = page.locator('input.check-input[data-key="doc-2"]');
    await estaCheckbox.click();
    await page.waitForTimeout(200);
    const checked = await estaCheckbox.isChecked();
    if (!checked) { log('TC-12 ESTA checkbox not checked'); return false; }
    // 팁 트리거 클릭
    await page.locator('button.tip-trigger[data-tip="tip-esta"]').click();
    await page.waitForTimeout(300);
    // 팁 텍스트 visible
    for (const t of ['cbp.dhs.gov', '$21', '72시간']) {
      if (!await tipHasText(page, 'tip-esta', t, 'TC-12')) return false;
    }
    return true;
  });

  // TC-12-B: localStorage 유지 — ESTA 체크 후 리로드
  await runTC('TC-12-B', async function (page) {
    await page.locator('#checklist').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    // ESTA 체크
    await page.locator('input.check-input[data-key="doc-2"]').click();
    await page.waitForTimeout(200);
    // 리로드
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    // 체크 상태 유지 확인
    const checked = await page.locator('input.check-input[data-key="doc-2"]').isChecked();
    if (!checked) { log('TC-12-B ESTA checkbox not persisted after reload'); return false; }
    return true;
  });

  // TC-15-STEP6: 모바일 375px — 가로 스크롤 없음 + 체크리스트 visible
  await runTC('TC-15-STEP6', async function (page) {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(200);
    const scrollWidth = await page.evaluate(function () { return document.body.scrollWidth; });
    if (scrollWidth > 375) { log('TC-15-STEP6 scrollWidth=' + scrollWidth + ' > 375'); return false; }
    await page.locator('#checklist').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    if (!await checkVisible(page, '체크리스트', 'TC-15-STEP6')) return false;
    if (!await checkVisible(page, '필수 서류', 'TC-15-STEP6')) return false;
    return true;
  });

  await browser.close();

  const passed = results.filter(r => r.pass).length;
  const totalErrors = results.reduce((s, r) => s + r.errors, 0);
  console.log('\n========== STEP 6 결과 ==========');
  results.forEach(r => console.log((r.pass ? '✅' : '❌') + ' ' + r.tc + (r.errors ? ' (console err: ' + r.errors + ')' : '')));
  console.log(`통과: ${passed}/${results.length} | 콘솔 에러: ${totalErrors}`);
  process.exit(passed === results.length && totalErrors === 0 ? 0 : 1);
})();
