// Recent drafts that the operator corrected before sending (logged by send-message). They show the
// model the company's preferred wording. Returns '' when there is nothing to add or the query fails.
// deno-lint-ignore no-explicit-any
export async function styleExamples(db: any, organizationId: string | null | undefined, limit = 4): Promise<string> {
  if (!organizationId) return '';
  try {
    const { data, error } = await db.from('activity_log').select('data')
      .eq('organization_id', organizationId).eq('event_type', 'message.sent').eq('data->>edited', 'true')
      .order('created_at', { ascending: false }).limit(limit);
    if (error || !data?.length) return '';
    return formatStyleExamples(data.map((r: { data: unknown }) => r.data));
  } catch {
    return '';
  }
}

// deno-lint-ignore no-explicit-any
export function formatStyleExamples(rows: any[]): string {
  const pairs = rows.filter((d) => d?.draft_body && d?.sent_body).map((d, i) =>
    `Przykład ${i + 1}\nSzkic: ${String(d.draft_body).slice(0, 600)}\nWersja wysłana przez operatora: ${String(d.sent_body).slice(0, 600)}`
  );
  if (!pairs.length) return '';
  return '\nOperator poprawiał ostatnio szkice tak jak poniżej. Naśladuj styl i długość wersji operatora. '
    + 'To wzory stylu, nie fakty: nie powtarzaj z nich imion, kwot ani terminów.\n' + pairs.join('\n\n');
}
