// STEP 3 — Itinerary 브라우저 테스트 (TC-05, TC-06)
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

// 요소 visible 여부 — IntersectionObserver 우회 포함
async function checkVisible(page, text, label) {
  try {
    const el = page.getByText(text, { exact: false }).first();
    await el.waitFor({ state: 'attached', timeout: 3000 });
    const style = await el.evaluate(function (e) {
      var s = window.getComputedStyle(e);
      return { display: s.display, visibility: s.visibility, opacity: s.opacity, maxHeight: s.maxHeight, overflow: s.overflow };
    });
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
      log(`FAIL ${label}: "${text}" hidden by style (display:${style.display} vis:${style.visibility} op:${style.opacity})`);
      return false;
    }
    if (style.overflow === 'hidden' && style.maxHeight === '0px') {
      log(`FAIL ${label}: "${text}" max-height:0`); return false;
    }
    return true;
  } catch (e) { log(`FAIL ${label}: "${text}" not found — ${e.message}`); return false; }
}

// 아코디언 본문 max-height 기반 visible + textContent 확인
async function accordionHasText(page, bodyLocator, text, label) {
  try {
    const maxH = await bodyLocator.evaluate(function (el) {
      return window.getComputedStyle(el).maxHeight;
    });
    if (maxH === '0px') {
      log(`FAIL ${label}: accordion closed (max-height:0px), "${text}" not visible`);
      return false;
    }
    const content = await bodyLocator.textContent({ timeout: 2000 });
    if (!content.includes(text)) {
      log(`FAIL ${label}: "${text}" not found in accordion body`);
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

  // TC-05: 타임라인 기본 렌더링
  await runTC('TC-05', async function (page) {
    await page.locator('#itinerary').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const checks = [
      ['D1', 'TC-05'], ['5/10 토', 'TC-05'],
      ['뉴욕 도착', 'TC-05'],
    ];
    for (const c of checks) {
      if (!await checkVisible(page, c[0], c[1])) return false;
    }
    // D7은 페이지 아래쪽 — 별도 스크롤
    await page.locator('#itinerary .timeline-item').last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const checksD7 = [
      ['D7', 'TC-05'], ['5/16 금', 'TC-05'],
      ['보스턴 마무리', 'TC-05'],
    ];
    for (const c of checksD7) {
      if (!await checkVisible(page, c[0], c[1])) return false;
    }
    return true;
  });

  // TC-06-D1: Day 1 아코디언 클릭 → 상세 텍스트 visible
  await runTC('TC-06-D1', async function (page) {
    await page.locator('#itinerary .timeline-item').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#itinerary .accordion-btn').first().click();
    await page.waitForTimeout(400);
    const body = page.locator('#itinerary .accordion-body').first();
    for (const t of ['09:00', 'JFK', '타임스퀘어', '에어트레인']) {
      if (!await accordionHasText(page, body, t, 'TC-06-D1')) return false;
    }
    return true;
  });

  // TC-06-D3: Day 3 아코디언 클릭 → 상세 텍스트 visible
  await runTC('TC-06-D3', async function (page) {
    await page.locator('#itinerary .timeline-item').nth(2).scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#itinerary .accordion-btn').nth(2).click();
    await page.waitForTimeout(400);
    const body = page.locator('#itinerary .accordion-body').nth(2);
    for (const t of ['Penn Station', 'Union Station', '링컨 기념관']) {
      if (!await accordionHasText(page, body, t, 'TC-06-D3')) return false;
    }
    // "2시간 45분"은 카드 본문 <p>에 위치 (항상 visible)
    if (!await checkVisible(page, '2시간 45분', 'TC-06-D3')) return false;
    return true;
  });

  // TC-06-D7: Day 7 아코디언 클릭 → 상세 텍스트 visible
  await runTC('TC-06-D7', async function (page) {
    await page.locator('#itinerary .timeline-item').last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#itinerary .accordion-btn').last().click();
    await page.waitForTimeout(400);
    const body = page.locator('#itinerary .accordion-body').last();
    for (const t of ['Boston Common', '프리덤 트레일', 'BOS', '출국']) {
      if (!await accordionHasText(page, body, t, 'TC-06-D7')) return false;
    }
    return true;
  });

  // TC-06-D: 단일 오픈 — D1 열기 → D3 클릭 → D1 자동 닫힘
  await runTC('TC-06-D', async function (page) {
    // D1 열기
    await page.locator('#itinerary .timeline-item').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#itinerary .accordion-btn').first().click();
    await page.waitForTimeout(300);
    const d1Open = await page.locator('#itinerary .accordion-btn').first().getAttribute('aria-expanded');
    if (d1Open !== 'true') { log('TC-06-D D1 열기 실패'); return false; }
    // D3 클릭
    await page.locator('#itinerary .timeline-item').nth(2).scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#itinerary .accordion-btn').nth(2).click();
    await page.waitForTimeout(400);
    // D1 닫혔는지 확인
    const d1After = await page.locator('#itinerary .accordion-btn').first().getAttribute('aria-expanded');
    if (d1After === 'true') { log('TC-06-D D1이 D3 클릭 후에도 열려 있음'); return false; }
    // D3 열렸는지 확인
    const d3Body = page.locator('#itinerary .accordion-body').nth(2);
    if (!await accordionHasText(page, d3Body, 'Penn Station', 'TC-06-D')) return false;
    return true;
  });

  // TC-15-STEP3: 모바일 375px — 가로 스크롤 없음 + 타임라인 visible
  await runTC('TC-15-STEP3', async function (page) {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(200);
    const scrollWidth = await page.evaluate(function () { return document.body.scrollWidth; });
    if (scrollWidth > 375) { log('TC-15-STEP3 scrollWidth=' + scrollWidth + ' > 375'); return false; }
    await page.locator('#itinerary').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    if (!await checkVisible(page, 'D1', 'TC-15-STEP3')) return false;
    if (!await checkVisible(page, '7일 상세 일정', 'TC-15-STEP3')) return false;
    return true;
  });

  await browser.close();

  const passed = results.filter(r => r.pass).length;
  const totalErrors = results.reduce((s, r) => s + r.errors, 0);
  console.log('\n========== STEP 3 결과 ==========');
  results.forEach(r => console.log((r.pass ? '✅' : '❌') + ' ' + r.tc + (r.errors ? ' (console err: ' + r.errors + ')' : '')));
  console.log(`통과: ${passed}/${results.length} | 콘솔 에러: ${totalErrors}`);
  process.exit(passed === results.length && totalErrors === 0 ? 0 : 1);
})();
