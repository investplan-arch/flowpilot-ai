// Behaviour tests for the edge functions against an in-memory database and a stubbed Graph API.
// Run: deno test --no-lock --allow-env --allow-read --import-map=supabase/functions/_tests/import_map.json supabase/functions/_tests/
// deno-lint-ignore-file no-explicit-any
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { state } from './fake-supabase.ts';

const handlers: Record<string, (r: Request) => Promise<Response>> = {};
let current = '';
(Deno as any).serve = (h: any) => { handlers[current] = h; return {} as any; };
async function load(name: string) {
  current = name;
  await import(`../${name}/index.ts`);
  return handlers[name];
}
Deno.env.set('SUPABASE_URL', 'http://db');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'k');
const send = await load('send-message');
const inbox = await load('inbox-data');
const control = await load('conversation-control');

let graphCalls: any[] = [];
let graphReply: () => Response = () => Response.json({ message_id: 'mid.1' });
globalThis.fetch = ((url: string, init: any) => {
  graphCalls.push({ url: String(url), body: JSON.parse(init?.body || '{}') });
  return Promise.resolve(graphReply());
}) as any;

const H = 3_600_000;
function seed(provider: 'facebook' | 'whatsapp', inboundHoursAgo: number) {
  graphCalls = [];
  graphReply = () => Response.json(provider === 'whatsapp' ? { messages: [{ id: 'wamid.1' }] } : { message_id: 'mid.1' });
  Deno.env.delete('META_HUMAN_AGENT_TAG');
  state.users = { tok: { id: 'u1', email: 'owner@example.com', user_metadata: {} } };
  state.tables = {
    profiles: [{ id: 'u1', organization_id: 'org1' }],
    conversations: [{ id: 'c1', organization_id: 'org1', integration_id: 'i1', external_thread_id: 'psid', channel: provider === 'facebook' ? 'messenger' : 'whatsapp', status: 'open', last_message_at: new Date().toISOString() }],
    integrations: [{ id: 'i1', organization_id: 'org1', provider, status: 'connected', external_page_id: 'page1' }],
    internal_integration_secrets: [{ integration_id: 'i1', page_access_token: 'pat' }],
    messages: [
      { id: 'in1', organization_id: 'org1', conversation_id: 'c1', direction: 'inbound', body: 'Dzień dobry', status: 'received', created_at: new Date(Date.now() - inboundHoursAgo * H).toISOString() },
      { id: 'd1', organization_id: 'org1', conversation_id: 'c1', direction: 'outbound', sender_type: 'ai', body: 'Szkic AI', status: 'pending_approval', created_at: new Date().toISOString() },
    ],
    approvals: [{ id: 'a1', organization_id: 'org1', message_id: 'd1', status: 'pending' }],
    activity_log: [],
  };
  state.rpc = { inbox_summaries_internal: () => [] };
}
const req = (body: any, method = 'POST', q = '') => new Request('http://x/' + q, { method, headers: { authorization: 'Bearer tok' }, body: method === 'GET' ? undefined : JSON.stringify(body) });
const msg = (id: string) => state.tables.messages.find((m) => m.id === id)!;

Deno.test('messenger inside 24h sends RESPONSE, approves the draft and logs the edit', async () => {
  seed('facebook', 2);
  const r = await send(req({ conversation_id: 'c1', body: 'Szkic AI poprawiony', draft_id: 'd1' }));
  assertEquals(r.status, 200);
  assertEquals(graphCalls.length, 1);
  assertEquals(graphCalls[0].body.messaging_type, 'RESPONSE');
  assertEquals(graphCalls[0].body.message.text, 'Szkic AI poprawiony');
  assertEquals(msg('d1').status, 'approved');
  assertEquals(state.tables.approvals[0].status, 'approved');
  const log = state.tables.activity_log.find((l) => l.event_type === 'message.sent')!;
  assertEquals([log.data.approved_ai_draft, log.data.edited, log.data.draft_body], [true, true, 'Szkic AI']);
  assert(log.data.response_seconds >= 2 * 3600 - 5);
});

Deno.test('messenger after 24h is blocked with a Polish message and the draft stays pending', async () => {
  seed('facebook', 30);
  const r = await send(req({ conversation_id: 'c1', body: 'Szkic AI', draft_id: 'd1' }));
  const z = await r.json();
  assertEquals([r.status, z.error], [409, 'window_closed']);
  assert(z.message.includes('Meta nie pozwala'));
  assertEquals(graphCalls.length, 0);
  assertEquals(msg('d1').status, 'pending_approval');
});

Deno.test('messenger 24h-7d uses HUMAN_AGENT only when enabled', async () => {
  seed('facebook', 30);
  Deno.env.set('META_HUMAN_AGENT_TAG', 'true');
  const r = await send(req({ conversation_id: 'c1', body: 'Ręczna odpowiedź' }));
  assertEquals(r.status, 200);
  assertEquals([graphCalls[0].body.messaging_type, graphCalls[0].body.tag], ['MESSAGE_TAG', 'HUMAN_AGENT']);
});

Deno.test('whatsapp after 24h is blocked', async () => {
  seed('whatsapp', 25);
  const r = await send(req({ conversation_id: 'c1', body: 'Hej' }));
  assertEquals(r.status, 409);
  assertEquals(graphCalls.length, 0);
});

Deno.test('two operators approving the same draft send it once', async () => {
  seed('facebook', 1);
  const [a, b] = await Promise.all([
    send(req({ conversation_id: 'c1', body: 'Szkic AI', draft_id: 'd1' })),
    send(req({ conversation_id: 'c1', body: 'Szkic AI inna wersja', draft_id: 'd1' })),
  ]);
  assertEquals([a.status, b.status].sort(), [200, 409]);
  assertEquals(graphCalls.length, 1);
});

Deno.test('Meta rejection releases the draft and returns a readable error', async () => {
  seed('facebook', 1);
  graphReply = () => Response.json({ error: { code: 100, message: 'x' } }, { status: 400 });
  const r = await send(req({ conversation_id: 'c1', body: 'Szkic AI', draft_id: 'd1' }));
  const z = await r.json();
  assertEquals([r.status, z.error], [400, 'meta_send_failed']);
  assert(z.message.startsWith('Messenger odrzucił'));
  assertEquals(msg('d1').status, 'pending_approval');
  assert(state.tables.activity_log.some((l) => l.event_type === 'message.send_failed' && l.data.code === 100));
});

Deno.test('Meta window error is reported as window_closed', async () => {
  seed('facebook', 1);
  graphReply = () => Response.json({ error: { code: 10, error_subcode: 2018278 } }, { status: 400 });
  const z = await (await send(req({ conversation_id: 'c1', body: 'x', draft_id: 'd1' }))).json();
  assertEquals(z.error, 'window_closed');
});

Deno.test('inbox-data exposes last_inbound_at and the reply window', async () => {
  seed('whatsapp', 3);
  const list = await (await inbox(req(null, 'GET'))).json();
  assertEquals(list.conversations[0].last_inbound_at, msg('in1').created_at);
  const thread = await (await inbox(req(null, 'GET', '?conversation_id=c1'))).json();
  assertEquals([thread.reply_window.mode, thread.reply_window.open], ['standard', true]);
});

Deno.test('conversation-control rejects a pending draft once', async () => {
  seed('facebook', 1);
  const r = await control(req({ conversation_id: 'c1', reject_draft_id: 'd1' }));
  assertEquals(r.status, 200);
  assertEquals([msg('d1').status, state.tables.approvals[0].status], ['rejected', 'rejected']);
  assertEquals((await control(req({ conversation_id: 'c1', reject_draft_id: 'd1' }))).status, 409);
  // takeover path unchanged
  assertEquals((await control(req({ conversation_id: 'c1', human_takeover: true }))).status, 200);
});

Deno.test('e-mail alert: one per conversation per 10 min, respects opt-out, off without config', async () => {
  const { notifyNewMessage } = await import('../_shared/notify.ts');
  seed('facebook', 0);
  state.users = { t1: { id: 'u1', email: 'owner@example.com', user_metadata: {} }, t2: { id: 'u2', email: 'agent@example.com', user_metadata: { notify_email: false } } };
  state.tables.profiles.push({ id: 'u2', organization_id: 'org1' });
  const alert = { organizationId: 'org1', conversationId: 'c1', contactName: 'Anna', channel: 'messenger', hasDraft: true, preview: 'tajne' };
  await notifyNewMessage((await import('./fake-supabase.ts')).createClient(), alert);
  assertEquals(graphCalls.length, 0, 'no e-mail without RESEND_API_KEY');
  Deno.env.set('RESEND_API_KEY', 're_test'); Deno.env.set('NOTIFY_FROM_EMAIL', 'FlowPilot <alerty@example.com>');
  graphReply = () => Response.json({ id: 'email1' });
  const db = (await import('./fake-supabase.ts')).createClient();
  await notifyNewMessage(db, alert);
  await notifyNewMessage(db, alert);
  assertEquals(graphCalls.length, 1);
  assertEquals(graphCalls[0].url, 'https://api.resend.com/emails');
  assertEquals(graphCalls[0].body.to, ['owner@example.com']);
  assert(!JSON.stringify(graphCalls[0].body).includes('tajne'));
  Deno.env.delete('RESEND_API_KEY'); Deno.env.delete('NOTIFY_FROM_EMAIL');
});
