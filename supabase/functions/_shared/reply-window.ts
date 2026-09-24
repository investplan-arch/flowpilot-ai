// Meta messaging windows:
// - Messenger and WhatsApp: free-form replies only within 24 h of the customer's last message.
// - Messenger: a human may reply for up to 7 days with the HUMAN_AGENT tag, but only when the
//   Meta app has the Human Agent feature approved (META_HUMAN_AGENT_TAG=true).
// - WhatsApp after 24 h: approved templates only, which FlowPilot does not send yet.
// - Telegram has no window.
export const HOUR = 3_600_000;
export const STANDARD_MS = 24 * HOUR;
export const HUMAN_AGENT_MS = 7 * 24 * HOUR;

export type WindowMode = 'unlimited' | 'standard' | 'human_agent' | 'closed';
export type ReplyWindow = {
  channel: string;
  mode: WindowMode;
  open: boolean;
  last_inbound_at: string | null;
  closes_at: string | null;
};

export function normalizeChannel(provider: string | null | undefined): string {
  const p = String(provider || '').toLowerCase();
  return p === 'facebook' ? 'messenger' : p;
}

export function replyWindow(
  provider: string | null | undefined,
  lastInboundAt: string | null | undefined,
  now = Date.now(),
  humanAgentEnabled = false,
): ReplyWindow {
  const channel = normalizeChannel(provider);
  const last = lastInboundAt ? Date.parse(lastInboundAt) : NaN;
  const lastIso = Number.isFinite(last) ? new Date(last).toISOString() : null;
  if (channel !== 'messenger' && channel !== 'whatsapp') {
    return { channel, mode: 'unlimited', open: true, last_inbound_at: lastIso, closes_at: null };
  }
  if (!Number.isFinite(last)) {
    return { channel, mode: 'closed', open: false, last_inbound_at: null, closes_at: null };
  }
  const age = now - last;
  if (age < STANDARD_MS) {
    return { channel, mode: 'standard', open: true, last_inbound_at: lastIso, closes_at: new Date(last + STANDARD_MS).toISOString() };
  }
  if (channel === 'messenger' && humanAgentEnabled && age < HUMAN_AGENT_MS) {
    return { channel, mode: 'human_agent', open: true, last_inbound_at: lastIso, closes_at: new Date(last + HUMAN_AGENT_MS).toISOString() };
  }
  return { channel, mode: 'closed', open: false, last_inbound_at: lastIso, closes_at: null };
}

export function humanAgentEnabled(): boolean {
  try { return Deno.env.get('META_HUMAN_AGENT_TAG') === 'true'; } catch { return false; }
}

export function windowClosedMessage(w: ReplyWindow): string {
  if (w.channel === 'whatsapp') {
    return 'Minęły ponad 24 godziny od ostatniej wiadomości klienta. WhatsApp pozwala teraz wysłać tylko zatwierdzony szablon. Poczekaj, aż klient napisze ponownie.';
  }
  return 'Minęło zbyt dużo czasu od ostatniej wiadomości klienta i Meta nie pozwala już odpisać w tej rozmowie. Poczekaj, aż klient napisze ponownie.';
}
