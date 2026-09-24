// E-mail alert to the team when a customer writes. Optional: sends only when RESEND_API_KEY and
// NOTIFY_FROM_EMAIL are set. A user opts out with user_metadata.notify_email === false (panel
// Ustawienia → Powiadomienia). At most one alert per conversation per NOTIFY_THROTTLE_MIN minutes.
// Message content is not included unless NOTIFY_INCLUDE_PREVIEW=true (the body is customer data).
export type NewMessageAlert = {
  organizationId: string;
  conversationId: string;
  contactName: string;
  channel: string;
  hasDraft: boolean;
  preview?: string;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const channelName = (c: string) => (c === 'whatsapp' ? 'WhatsApp' : c === 'telegram' ? 'Telegram' : 'Messenger');

export function buildAlertEmail(a: NewMessageAlert, panelUrl: string, includePreview: boolean) {
  const name = (a.contactName || 'Klient').slice(0, 80);
  const ch = channelName(a.channel);
  const status = a.hasDraft ? 'Szkic odpowiedzi AI czeka na Twoją akceptację.' : 'Klient czeka na odpowiedź.';
  const preview = includePreview && a.preview ? a.preview.replace(/\s+/g, ' ').trim().slice(0, 160) : '';
  const subject = `Nowa wiadomość od ${name} (${ch})`;
  const text = [`${name} napisał(a) na ${ch}.`, status, preview ? `„${preview}”` : '', `Otwórz panel: ${panelUrl}`]
    .filter(Boolean).join('\n\n');
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111">`
    + `<p><strong>${esc(name)}</strong> napisał(a) na ${ch}.</p><p>${status}</p>`
    + (preview ? `<p style="color:#555">„${esc(preview)}”</p>` : '')
    + `<p><a href="${esc(panelUrl)}" style="display:inline-block;background:#3da9fc;color:#04111f;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Otwórz panel FlowPilot</a></p>`
    + `<p style="color:#888;font-size:12px">Powiadomienia możesz wyłączyć w panelu: Ustawienia → Powiadomienia.</p></div>`;
  return { subject, text, html };
}

function env(name: string): string {
  try { return Deno.env.get(name) || ''; } catch { return ''; }
}

export function emailAlertsConfigured(): boolean {
  return !!(env('RESEND_API_KEY') && env('NOTIFY_FROM_EMAIL'));
}

// deno-lint-ignore no-explicit-any
export async function notifyNewMessage(db: any, a: NewMessageAlert): Promise<void> {
  try {
    const key = env('RESEND_API_KEY'), from = env('NOTIFY_FROM_EMAIL');
    if (!key || !from) return;
    const throttleMin = Math.max(1, Number(env('NOTIFY_THROTTLE_MIN')) || 10);
    const since = new Date(Date.now() - throttleMin * 60_000).toISOString();
    const { data: recent, error: recentError } = await db.from('activity_log').select('id')
      .eq('organization_id', a.organizationId).eq('event_type', 'notification.email')
      .eq('entity_id', a.conversationId).gte('created_at', since).limit(1);
    if (recentError || (recent && recent.length)) return;

    const { data: members } = await db.from('profiles').select('id').eq('organization_id', a.organizationId).limit(20);
    const emails: string[] = [];
    for (const m of members || []) {
      const { data } = await db.auth.admin.getUserById(m.id);
      const u = data?.user;
      if (u?.email && u.user_metadata?.notify_email !== false) emails.push(u.email);
    }
    if (!emails.length) return;

    // Record first so concurrent webhook deliveries do not send twice.
    await db.from('activity_log').insert({
      organization_id: a.organizationId, event_type: 'notification.email', entity_type: 'conversation',
      entity_id: a.conversationId, data: { recipients: emails.length, channel: a.channel },
    });
    const mail = buildAlertEmail(a, env('PANEL_URL') || 'https://flowpilot-ai-app.onrender.com/', env('NOTIFY_INCLUDE_PREVIEW') === 'true');
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: emails, subject: mail.subject, text: mail.text, html: mail.html }),
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) console.error('notify_email_failed', r.status);
  } catch (e) {
    console.error('notify_email_error', e instanceof Error ? e.name : 'unknown');
  }
}

// Runs the alert after the response when the runtime supports it, so webhooks stay fast.
export function runInBackground(task: Promise<unknown>): Promise<unknown> | void {
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) { rt.waitUntil(task); return; }
  return task;
}
