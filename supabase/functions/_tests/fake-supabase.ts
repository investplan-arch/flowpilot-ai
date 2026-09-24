// In-memory stand-in for npm:@supabase/supabase-js used by the function tests (see import_map.json).
// Supports the query-builder subset the functions use.
// deno-lint-ignore-file no-explicit-any
type Row = Record<string, any>;
export const state: { tables: Record<string, Row[]>; users: Record<string, any>; rpc: Record<string, (a: any) => any> } = {
  tables: {}, users: {}, rpc: {},
};
let seq = 0;
const get = (r: Row, k: string) => {
  const m = k.match(/^(\w+)->>(\w+)$/);
  if (m) { const v = r[m[1]]?.[m[2]]; return v === undefined || v === null ? null : String(v); }
  return r[k];
};

class Query {
  private filters: ((r: Row) => boolean)[] = [];
  private op: 'select' | 'insert' | 'update' = 'select';
  private payload: any;
  private orderBy: [string, boolean] | null = null;
  private lim = Infinity;
  private countOnly = false;
  private returning = false;
  constructor(private table: string) {}
  select(_cols?: string, opts?: any) { if (this.op === 'select') { this.countOnly = !!opts?.head; } else this.returning = true; return this; }
  insert(p: any) { this.op = 'insert'; this.payload = p; return this; }
  update(p: any) { this.op = 'update'; this.payload = p; return this; }
  eq(k: string, v: any) { this.filters.push((r) => get(r, k) === v); return this; }
  in(k: string, vs: any[]) { this.filters.push((r) => vs.includes(get(r, k))); return this; }
  gte(k: string, v: any) { this.filters.push((r) => get(r, k) >= v); return this; }
  lte(k: string, v: any) { this.filters.push((r) => get(r, k) <= v); return this; }
  not() { return this; }
  order(k: string, o?: any) { this.orderBy = [k, o?.ascending !== false]; return this; }
  limit(n: number) { this.lim = n; return this; }
  range(a: number, b: number) { this.lim = b - a + 1; return this; }
  private rows() { return (state.tables[this.table] ||= []); }
  private run(): { data: any; error: any; count?: number } {
    const rows = this.rows();
    if (this.op === 'insert') {
      const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((p: Row) => ({ id: `${this.table}-${++seq}`, created_at: new Date(Date.now() + seq).toISOString(), ...p }));
      rows.push(...list);
      return { data: Array.isArray(this.payload) ? list : list[0], error: null };
    }
    let hit = rows.filter((r) => this.filters.every((f) => f(r)));
    if (this.op === 'update') { hit.forEach((r) => Object.assign(r, this.payload)); return { data: this.returning ? hit : null, error: null }; }
    if (this.orderBy) { const [k, asc] = this.orderBy; hit = [...hit].sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * (asc ? 1 : -1)); }
    hit = hit.slice(0, this.lim);
    return { data: this.countOnly ? null : hit.map((r) => ({ ...r })), error: null, count: hit.length };
  }
  maybeSingle() { const r = this.run(); const d = Array.isArray(r.data) ? r.data[0] ?? null : r.data; return Promise.resolve({ data: d, error: null }); }
  single() { const r = this.run(); const d = Array.isArray(r.data) ? r.data[0] ?? null : r.data; return Promise.resolve({ data: d, error: d ? null : { code: 'PGRST116' } }); }
  then(res: any, rej?: any) { return Promise.resolve(this.run()).then(res, rej); }
}

export function createClient() {
  return {
    from: (t: string) => new Query(t),
    rpc: (name: string, args: any) => Promise.resolve({ data: state.rpc[name]?.(args) ?? null, error: null }),
    auth: {
      getUser: (jwt: string) => Promise.resolve({ data: { user: state.users[jwt] ?? null } }),
      admin: { getUserById: (id: string) => Promise.resolve({ data: { user: Object.values(state.users).find((u: any) => u.id === id) ?? null } }) },
    },
  };
}
