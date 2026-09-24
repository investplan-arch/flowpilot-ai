import { assertEquals, assert } from 'jsr:@std/assert@1';
import { HOUR, replyWindow } from './reply-window.ts';
import { buildAlertEmail } from './notify.ts';

const now = Date.parse('2026-09-24T12:00:00Z');
const ago = (h: number) => new Date(now - h * HOUR).toISOString();

Deno.test('messenger within 24h is a standard reply', () => {
  const w = replyWindow('facebook', ago(23.9), now);
  assertEquals([w.channel, w.mode, w.open], ['messenger', 'standard', true]);
  assertEquals(w.closes_at, new Date(now + 0.1 * HOUR).toISOString());
});

Deno.test('messenger after 24h is closed unless Human Agent is enabled', () => {
  assertEquals(replyWindow('messenger', ago(30), now).mode, 'closed');
  assertEquals(replyWindow('messenger', ago(30), now, true).mode, 'human_agent');
  assertEquals(replyWindow('messenger', ago(24 * 7 + 1), now, true).mode, 'closed');
});

Deno.test('whatsapp after 24h is closed even with Human Agent', () => {
  assertEquals(replyWindow('whatsapp', ago(24), now, true).open, false);
  assertEquals(replyWindow('whatsapp', ago(1), now).open, true);
});

Deno.test('no inbound message closes Meta channels, telegram is unlimited', () => {
  assertEquals(replyWindow('whatsapp', null, now).mode, 'closed');
  assertEquals(replyWindow('telegram', null, now).mode, 'unlimited');
});

Deno.test('alert email hides content by default and escapes names', () => {
  const a = { organizationId: 'o', conversationId: 'c', contactName: '<b>Anna</b>', channel: 'whatsapp', hasDraft: true, preview: 'Mój PESEL to 123' };
  const m = buildAlertEmail(a, 'https://panel/', false);
  assert(!m.text.includes('PESEL') && !m.html.includes('PESEL'));
  assert(m.html.includes('&lt;b&gt;Anna&lt;/b&gt;'));
  assert(m.subject.includes('WhatsApp'));
  assert(buildAlertEmail(a, 'https://panel/', true).text.includes('PESEL'));
});
