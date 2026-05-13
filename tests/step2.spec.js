// STEP 2 — Cities 브라우저 테스트 (TC-03, TC-04, TC-04-C, TC-15)
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

// 모달 내 텍스트는 textContent로 직접 확인 (getByText boundingBox null 우회)
async function modalHasText(page, text, label) {
  try {
    const content = await page.locator('#cityModal .modal-city-body').textContent({ timeout: 3000 });
    if (!content.includes(text)) {
      log(`FAIL ${label}: "${text}" not found in modal body`); return false;
    }
    // 모달이 열려 있는지도 확인
    const open = await page.locator('dialog#cityModal[open]').count();
    if (open === 0) { log(`FAIL ${label}: dialog not open`); return false; }
    return true;
  } catch (e) { log(`FAIL ${label}: "${text}" error — ${e.message}`); return false; }
}

// reveal 클래스 요소는 스크롤 후 강제 visible 처리
async function scrollAndCheck(page, selector, text, label) {
  try {
    await page.locator(selector).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    return await checkVisible(page, text, label);
  } catch (e) { log(`FAIL ${label}: scroll error — ${e.message}`); return false; }
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

  // TC-03: 도시 카드 기본 렌더링
  await runTC('TC-03', async function (page) {
    // 도시 섹션으로 스크롤 (reveal 클래스 활성화)
    await page.locator('#cities').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const checks = [
      ['뉴욕', 'TC-03'], ['New York', 'TC-03'],
      ['Day 1', 'TC-03'], ['워싱턴 D.C.', 'TC-03'],
      ['필라델피아', 'TC-03'], ['보스턴', 'TC-03'], ['Boston', 'TC-03'],
    ];
    for (const c of checks) {
      if (!await checkVisible(page, c[0], c[1])) return false;
    }
    const cards = await page.locator('button.city-card').count();
    if (cards < 4) { log('TC-03 city cards < 4 (found ' + cards + ')'); return false; }
    return true;
  });

  // TC-04-NY: 뉴욕 카드 클릭 → 모달 상세 텍스트 (textContent 기반)
  await runTC('TC-04-NY', async function (page) {
    await page.locator('#cities').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.locator('button.city-card[data-city="ny"]').click();
    await page.waitForSelector('dialog#cityModal[open]', { timeout: 3000 });
    await page.waitForTimeout(200);
    const checks = ['미드타운', '자유의 여신상 페리', '$24', '메트로카드'];
    for (const t of checks) {
      if (!await modalHasText(page, t, 'TC-04-NY')) return false;
    }
    return true;
  });

  // TC-04-DC: 워싱턴 D.C. 카드 클릭 → 모달 상세 텍스트
  await runTC('TC-04-DC', async function (page) {
    await page.locator('#cities').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.locator('button.city-card[data-city="dc"]').click();
    await page.waitForSelector('dialog#cityModal[open]', { timeout: 3000 });
    await page.waitForTimeout(200);
    const checks = ['스미소니언', '무료', '국회의사당', 'house.gov'];
    for (const t of checks) {
      if (!await modalHasText(page, t, 'TC-04-DC')) return false;
    }
    return true;
  });

  // TC-04-C: 모달 닫기 버튼(✕) 클릭 → 상세 텍스트 not visible
  await runTC('TC-04-C', async function (page) {
    await page.locator('#cities').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.locator('button.city-card[data-city="ny"]').click();
    await page.waitForSelector('dialog#cityModal[open]', { timeout: 3000 });
    await page.waitForTimeout(200);
    // 모달 열림 확인
    if (!await modalHasText(page, '미드타운', 'TC-04-C open')) return false;
    // 닫기 버튼 클릭
    await page.locator('.modal-close').click();
    await page.waitForTimeout(300);
    // dialog[open] 속성 사라졌는지 확인
    const stillOpen = await page.locator('dialog#cityModal[open]').count();
    if (stillOpen > 0) { log('TC-04-C modal still open after close btn'); return false; }
    return true;
  });

  // TC-15-STEP2: 모바일 375px — 가로 스크롤 없음 + 도시 이름 visible
  await runTC('TC-15-STEP2', async function (page) {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(200);
    // 스크롤 너비 확인
    const scrollWidth = await page.evaluate(function () { return document.body.scrollWidth; });
    if (scrollWidth > 375) { log('TC-15-STEP2 scrollWidth=' + scrollWidth + ' > 375'); return false; }
    // 도시 섹션 스크롤 후 도시 이름 visible
    await page.locator('#cities').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const checks = [['뉴욕', 'TC-15-STEP2'], ['보스턴', 'TC-15-STEP2']];
    for (const c of checks) {
      if (!await checkVisible(page, c[0], c[1])) return false;
    }
    return true;
  });

  await browser.close();

  const passed = results.filter(r => r.pass).length;
  const totalErrors = results.reduce((s, r) => s + r.errors, 0);
  console.log('\n========== STEP 2 결과 ==========');
  results.forEach(r => console.log((r.pass ? '✅' : '❌') + ' ' + r.tc + (r.errors ? ' (console err: ' + r.errors + ')' : '')));
  console.log(`통과: ${passed}/${results.length} | 콘솔 에러: ${totalErrors}`);
  process.exit(passed === results.length && totalErrors === 0 ? 0 : 1);
})();
