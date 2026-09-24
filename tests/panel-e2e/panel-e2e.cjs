// QA harness: loads a panel HTML under the production origin with a mocked Supabase backend,
// drives the real UI and records every backend call.
// Usage: npm i playwright-core && CHROMIUM_PATH=/path/to/chrome node tests/panel-e2e/panel-e2e.cjs render/app.html /tmp/panel-shots
const { chromium } = require('playwright-core');
const fs = require('fs');
const [,, htmlPath, outDir] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const HTML = fs.readFileSync(htmlPath, 'utf8');
const ORIGIN = 'https://flowpilot-ai-app.onrender.com/';
const SB = 'https://jhkmemvsmnvyqfouzhqb.supabase.co';
const now = Date.now(), iso = m => new Date(now - m * 60000).toISOString();
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const TOKEN = 'h.' + b64({ exp: 9999999999 }) + '.s';

const STATUS = { user: { role: 'owner', system_admin: false }, ai: { engine_ready: true, ready: true, runtime_status: 'ok' },
  integrations: [{ provider: 'facebook', status: 'connected', display_name: 'DotacjaPlus' }, { provider: 'whatsapp', status: 'connected', display_name: '+48 500 000 000' }],
  capabilities: { messenger: true, email_notifications: true }, metrics: { conversations: 4, pending_approvals: 2, due_followups: 1, drafts_sent_7d: 10, drafts_unedited_7d: 7, median_response_seconds_7d: 840 }, organization: { name: 'DotacjaPlus', industry: 'dotacje' } };
const LEADS = [
  { id: 'l1', contact_name: 'Anna Kowalczyk', pipeline_stage: 'qualified', score: 82, recommended_action: 'Umów rozmowę telefoniczną', intent: 'sprzęt + PV', estimated_value: null },
  { id: 'l2', contact_name: 'Piotr Nowicki', pipeline_stage: 'new', score: 70, estimated_value: 3900 },
  { id: 'l3', contact_name: 'Studio Forma', pipeline_stage: 'won', score: 90, estimated_value: 5000 },
  { id: 'l4', contact_name: 'Michał Dudek', pipeline_stage: 'lost', score: 20 }];
const CONVS = [
  { id: 'c1', lead_id: 'l1', channel: 'messenger', needs_reply: true, pending_count: 1, contact: { name: 'Anna Kowalczyk' }, last_message: { body: 'Czy na fotowoltaikę dla gabinetu też jest dofinansowanie?', created_at: iso(10) } },
  { id: 'c2', lead_id: 'l2', channel: 'whatsapp', needs_reply: true, pending_count: 1, contact: { name: 'Piotr Nowicki' }, last_message: { body: 'Wysłałem skan KRS, co dalej?', created_at: iso(40) } },
  { id: 'c3', lead_id: null, channel: 'whatsapp', needs_reply: true, pending_count: 0, contact: { name: 'Karolina Mazur' }, last_message: { body: 'Do kiedy trwa nabór?', created_at: iso(900) } },
  { id: 'c4', lead_id: 'l3', channel: 'messenger', needs_reply: false, pending_count: 0, contact: { name: 'Tomasz Wrona' }, last_message: { body: 'Dziękuję, odezwę się po weekendzie.', created_at: iso(1500) } }];
for (const c of CONVS) c.last_inbound_at = c.last_message.created_at;
const WINDOW = id => id === 'c2' ? { channel: 'whatsapp', mode: 'closed', open: false } : { channel: 'messenger', mode: 'standard', open: true, closes_at: new Date(Date.now() + (id === 'c1' ? 2 : 20) * 3600e3).toISOString() };
const THREAD = id => ({ reply_window: WINDOW(id), contact: CONVS.find(c => c.id === id).contact, lead: id === 'c1' ? LEADS[0] : null, conversation: { human_takeover: false },
  messages: [
    { id: 'm1', direction: 'inbound', body: 'Dzień dobry, szukam dofinansowania na nowy sprzęt.', created_at: iso(900) },
    { id: 'm2', direction: 'outbound', status: 'sent', body: 'Od kiedy działa firma?', sent_at: iso(890) },
    { id: 'm3', direction: 'inbound', body: CONVS.find(c => c.id === id).last_message.body, created_at: iso(10) },
    ...(CONVS.find(c => c.id === id).pending_count ? [{ id: 'd-' + id, direction: 'outbound', status: 'pending_approval', body: 'Szkic AI dla ' + id }] : [])] });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const results = { calls: [], errors: [], checks: [] };
  const check = (name, ok, extra) => { results.checks.push({ name, ok: !!ok, extra }); if (!ok) console.log('FAIL', name, extra ?? ''); };
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1 });
    await ctx.addInitScript(t => localStorage.setItem('flowpilot_auth_v36', JSON.stringify({ access_token: t, refresh_token: 'r', user: { email: 'owner@example.com' } })), TOKEN);
    if (vp.name === 'desktop') await ctx.addInitScript(() => { window.__notes = []; class N { constructor(t, o) { window.__notes.push({ t, o }); } } N.permission = 'granted'; N.requestPermission = () => Promise.resolve('granted'); window.Notification = N; });
    await ctx.route(ORIGIN + '**', r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: HTML }));
    await ctx.route(SB + '/**', async r => {
      const u = new URL(r.request().url()), name = u.pathname.replace('/functions/v1/', ''), method = r.request().method();
      const body = r.request().postData();
      results.calls.push({ vp: vp.name, method, name, search: u.search, body: body || null });
      const j = o => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
      if (name === 'saas-status') return j(STATUS);
      if (name === 'sales-pipeline') return j(method === 'GET' ? { leads: LEADS, metrics: { pipeline_value: 8900, weighted_value: 4000, due_followups: 1, conversion_rate: 25 } } : { ok: true });
      if (name === 'followup-center') return j({ queue: [{ id: 'l1', contact_name: 'Anna Kowalczyk', next_follow_up_at: iso(-60), recommended_action: 'Zadzwoń' }], notifications: [{ title: 'Nowa wiadomość', contact_name: 'Piotr Nowicki', action: 'Sprawdź szkic' }] });
      if (name === 'inbox-data') { const c = u.searchParams.get('conversation_id'); return j(c ? THREAD(c) : { conversations: CONVS, has_more: false }); }
      if (name === 'ai-settings') return j({ tone: 'konkretny', business_goal: 'convert', autonomy: 'approval', qualification_rules: 'x', handoff_rules: 'y' });
      if (name === 'workspace-settings') return j({ organization: { name: 'DotacjaPlus', industry: 'dotacje', website: 'https://example.com' }, profile: { full_name: 'Dawid S.', email: 'owner@example.com', role: 'owner' } });
      if (name === 'billing-info') return j({ plan_key: 'lead_pilot', subscription_status: 'active', plans: [{ name: 'Lead Pilot', amount: 19900 }] });
      if (name === 'telegram-config') return j({});
      if (name === 'ai-draft' && body && JSON.parse(body).rewrite) return j({ ok: true, draft: 'Krótsza wersja' });
      if (u.pathname === '/auth/v1/user') return j({ id: 'u1', email: 'owner@example.com', user_metadata: JSON.parse(body || '{}').data || {} });
      return j({ ok: true });
    });
    const page = await ctx.newPage();
    page.on('pageerror', e => results.errors.push(vp.name + ': ' + e.message));
    page.on('console', m => { if (m.type() === 'error') results.errors.push(vp.name + ' console: ' + m.text()); });
    await page.goto(ORIGIN);
    await page.waitForSelector('#app:not(.hide)');
    await page.waitForFunction(() => document.querySelectorAll('#convList [data-conv]').length === 4);
    await page.waitForTimeout(300);
    const shot = n => page.screenshot({ path: `${outDir}/${vp.name}-${n}.png` });
    await shot('1-today');
    const navBtn = p => page.locator(`.nav button[data-page="${p}"]:visible`).first();
    const onPage = async p => page.evaluate(p => document.getElementById(p).classList.contains('on') && getComputedStyle(document.getElementById(p)).display !== 'none', p);
    // Navigation: every page reachable
    const pages = vp.name === 'desktop' ? ['inbox', 'pipeline', 'integrations', 'control', 'settings', 'today'] : ['inbox', 'pipeline', 'today'];
    for (const p of pages) { await navBtn(p).click(); await page.waitForTimeout(150); check(`${vp.name} nav ${p}`, await onPage(p)); if (p !== 'today') await shot('nav-' + p); }
    if (vp.name === 'mobile') {
      for (const p of ['integrations', 'control', 'settings']) {
        const more = page.locator('.nav button[data-page="more"]:visible');
        if (await more.count()) { await more.click(); await page.waitForTimeout(100); if (p === 'integrations') await shot('nav-more'); await page.locator(`[data-go="${p}"]`).click(); }
        else await navBtn(p).click();
        await page.waitForTimeout(150); check(`mobile nav ${p}`, await onPage(p)); await shot('nav-' + p);
      }
      await navBtn('today').click();
    }
    // Pending badge
    check(`${vp.name} inbox count visible`, await page.locator('#inboxCount:visible').count() >= 1);
    // Open conversation c1 via inbox
    await navBtn('inbox').click();
    await page.locator('[data-conv="c1"]').click();
    await page.waitForFunction(() => document.getElementById('reply').value === 'Szkic AI dla c1');
    await page.waitForTimeout(200);
    check(`${vp.name} send label pending`, (await page.textContent('#sendReply')).includes('Akceptuj i wyślij'));
    check(`${vp.name} thread visible`, await page.locator('#messages:visible').count() === 1);
    check(`${vp.name} send button visible`, await page.locator('#sendReply').isVisible());
    const box = await page.locator('#sendReply').boundingBox();
    check(`${vp.name} send button inside viewport`, box && box.y + box.height <= vp.height + 1 && box.x >= 0 && box.x + box.width <= vp.width + 1, box);
    await shot('3-conversation');
    // Edit draft and send: payload must carry edited text and the draft id
    await page.fill('#reply', 'Poprawiona odpowiedź');
    const before = results.calls.length;
    await page.locator('#sendReply').click();
    await page.waitForFunction(() => /wysłana|już wysłana/.test(document.getElementById('inboxResult').textContent));
    const send = results.calls.slice(before).filter(c => c.name === 'send-message');
    check(`${vp.name} exactly one send`, send.length === 1, send.length);
    check(`${vp.name} send payload`, send[0] && JSON.stringify(JSON.parse(send[0].body)) === JSON.stringify({ conversation_id: 'c1', body: 'Poprawiona odpowiedź', draft_id: 'd-c1' }), send[0]?.body);
    // Empty text must not send
    if (vp.name === 'mobile') await page.locator('#backConvs').click();
    await page.locator('[data-conv="c3"]').evaluate(b => b.click());
    await page.waitForFunction(() => document.getElementById('convTitle').textContent === 'Karolina Mazur');
    const b2 = results.calls.length; await page.fill('#reply', '   '); await page.locator('#sendReply').click(); await page.waitForTimeout(200);
    check(`${vp.name} empty reply blocked`, !results.calls.slice(b2).some(c => c.name === 'send-message'));
    // Takeover
    const b3 = results.calls.length; await page.locator('#takeoverBtn').click(); await page.waitForTimeout(300);
    const tk = results.calls.slice(b3).find(c => c.name === 'conversation-control');
    check(`${vp.name} takeover call`, tk && JSON.parse(tk.body).conversation_id === 'c3' && JSON.parse(tk.body).human_takeover === true, tk?.body);
    // AI draft
    const b4 = results.calls.length; await page.locator('#genReply').click(); await page.waitForTimeout(300);
    check(`${vp.name} ai-draft call`, results.calls.slice(b4).some(c => c.name === 'ai-draft' && JSON.parse(c.body).conversation_id === 'c3'));
    if (vp.name === 'mobile') { await page.locator('#backConvs').click(); await page.waitForTimeout(100); check('mobile back to list', await page.locator('#convList:visible').count() === 1); await shot('2-inbox-list'); }
    // Filter
    await page.selectOption('#inboxFilter', 'approval'); await page.waitForTimeout(100);
    check(`${vp.name} filter approval`, await page.locator('#convList [data-conv]').count() === 2);
    await page.selectOption('#inboxFilter', 'all');
    // Pipeline lead edit + save
    await navBtn('pipeline').click(); await page.locator('[data-lead="l2"]').click();
    check(`${vp.name} lead modal`, await page.locator('#leadModal:visible').count() === 1);
    await shot('4-lead-modal');
    const b5 = results.calls.length; await page.fill('#leadValue', '4200'); await page.locator('#leadSave').click(); await page.waitForTimeout(400);
    const pl = results.calls.slice(b5).find(c => c.name === 'sales-pipeline' && c.method === 'PATCH');
    check(`${vp.name} lead save`, pl && JSON.parse(pl.body).estimated_value === 4200 && JSON.parse(pl.body).id === 'l2', pl?.body);
    await page.waitForTimeout(500);
    // --- New features
    page.on('dialog', d => d.accept());
    const openC = async id => { if (await page.locator('#backConvs:visible').count()) await page.locator('#backConvs').click(); await navBtn('inbox').click(); if (await page.locator('#backConvs:visible').count()) await page.locator('#backConvs').click();
      await page.locator(`[data-conv="${id}"]`).evaluate(b => b.click()); await page.waitForFunction(id => document.getElementById('convTitle').textContent !== 'Wczytuję rozmowę…' && window.CURRENT_OK !== 0, id); await page.waitForTimeout(250); };
    if (await page.locator('#backConvs:visible').count()) await page.locator('#backConvs').click();
    await navBtn('today').click(); await page.waitForTimeout(100);
    const qs = await page.textContent('#qualityStats');
    check(`${vp.name} quality stats`, qs.includes('7 z 10 (70%)') && qs.includes('14 min'), qs);
    check(`${vp.name} title count`, (await page.title()).startsWith('(2) '), await page.title());
    await openC('c1');
    const rw = await page.locator('#replyWindow').textContent();
    check(`${vp.name} reply window open`, rw.includes('Możesz odpowiedzieć jeszcze') && (await page.getAttribute('#replyWindow', 'class')).includes('soon'), rw);
    check(`${vp.name} reject visible`, await page.locator('#rejectDraft').isVisible());
    await shot('5-window-open');
    let b6 = results.calls.length; await page.locator('[data-rewrite="shorter"]').click(); await page.waitForFunction(() => document.getElementById('reply').value === 'Krótsza wersja');
    const rwc = results.calls.slice(b6).find(c => c.name === 'ai-draft');
    check(`${vp.name} rewrite call`, rwc && JSON.parse(rwc.body).rewrite.instruction === 'shorter' && JSON.parse(rwc.body).rewrite.text === 'Szkic AI dla c1', rwc?.body);
    b6 = results.calls.length; await page.locator('#rejectDraft').click(); await page.waitForTimeout(400);
    const rj = results.calls.slice(b6).find(c => c.name === 'conversation-control');
    check(`${vp.name} reject call`, rj && JSON.parse(rj.body).reject_draft_id === 'd-c1', rj?.body);
    await openC('c2');
    check(`${vp.name} window closed blocks send`, (await page.textContent('#replyWindow')).includes('zamknięte') && await page.locator('#sendReply').isDisabled());
    await shot('6-window-closed');
    if (vp.name === 'mobile') await page.locator('#backConvs').click();
    check(`${vp.name} waiting chips`, (await page.locator('#convList .wait').count()) >= 3);
    await page.selectOption('#inboxFilter', 'approval'); await page.waitForTimeout(100);
    check(`${vp.name} oldest first`, (await page.locator('#convList [data-conv]').first().getAttribute('data-conv')) === 'c2');
    await shot('7-list-waiting');
    await page.selectOption('#inboxFilter', 'all');
    if (vp.name === 'desktop') {
      CONVS.unshift({ id: 'c5', lead_id: null, channel: 'messenger', needs_reply: true, pending_count: 1, contact: { name: 'Ewa Lis' }, last_message: { body: 'Hej', created_at: new Date().toISOString() }, last_inbound_at: new Date().toISOString() });
      await page.evaluate(() => { document.hasFocus = () => false; });
      await page.evaluate(() => pollInbox());
      const notes = await page.evaluate(() => window.__notes);
      check('desktop browser notification on new message', notes.length === 1 && notes[0].t === 'Nowa wiadomość: Ewa Lis', notes);
      check('desktop list refreshed by polling', await page.locator('[data-conv="c5"]').count() === 1);
      await page.evaluate(() => pollInbox());
      check('desktop no repeat notification', (await page.evaluate(() => window.__notes.length)) === 1);
      CONVS.shift();
      await navBtn('settings').click(); await page.waitForTimeout(100);
      check('desktop notify settings', (await page.textContent('#browserNotifyState')).includes('Włączone') && await page.locator('#emailNotify').isChecked());
      b6 = results.calls.length; await page.locator('#emailNotify').click(); await page.waitForTimeout(300);
      const pu = results.calls.slice(b6).find(c => c.name === '/auth/v1/user' || c.name.endsWith('auth/v1/user'));
      check('desktop email opt-out saved', pu && JSON.parse(pu.body).data.notify_email === false, results.calls.slice(b6));
      await shot('8-settings-notify');
    }
    // Horizontal overflow
    for (const p of ['today', 'inbox', 'pipeline']) { await navBtn(p).click(); await page.waitForTimeout(100);
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); check(`${vp.name} no page h-scroll on ${p}`, ov <= 1, ov); }
    await ctx.close();
  }
  // Logged out: login screen renders
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(ORIGIN + '**', r => r.fulfill({ status: 200, contentType: 'text/html', body: HTML }));
  const p = await ctx.newPage(); p.on('pageerror', e => results.errors.push('login: ' + e.message));
  await p.goto(ORIGIN); await p.waitForSelector('#login:not(.hide)'); await p.screenshot({ path: `${outDir}/login.png` });
  check('login visible', await p.locator('#loginBtn').isVisible());
  await browser.close();
  fs.writeFileSync(`${outDir}/results.json`, JSON.stringify(results, null, 1));
  const failed = results.checks.filter(c => !c.ok);
  console.log(`checks: ${results.checks.length - failed.length}/${results.checks.length} passed; page errors: ${results.errors.length}`);
  results.errors.forEach(e => console.log('ERR', e));
})().catch(e => { console.error(e); process.exit(1); });
