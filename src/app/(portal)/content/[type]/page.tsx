'use client';
import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, describeError } from '@/lib/api';
import { entityDef } from '@/lib/schema';

type Row = { id?: string; day?: string; status: string; version: number; live_version: number | null; has_unpublished_changes: boolean; [k: string]: unknown };

export default function List({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const def = entityDef(type);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [note, setNote] = useState(''); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const key = (r: Row) => String(r.id ?? r.day);

  const load = useCallback(async () => {
    try { setRows(await api<Row[]>(`/v1/admin/content/${type}?limit=100`)); setErr(''); } catch (e) { setErr(describeError(e)); }
  }, [type]);
  useEffect(() => { setSel(new Set()); void load(); }, [load]);

  if (!def) return <p>Unknown content type.</p>;

  async function publish() {
    setMsg(''); setErr('');
    try {
      const r = await api<{ count: number }>('/v1/admin/publish', { method: 'POST', body: { items: [...sel].map((id) => ({ type, id })), note: note || undefined } });
      setMsg(`Published ${r.count} item(s). They will appear in the app on its next sync.`); setSel(new Set()); void load();
    } catch (e) { setErr(describeError(e)); }
  }
  const toggle = (k: string) => setSel((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  return (
    <>
      <div className="row"><h1 style={{ flex: 1 }}>{def.plural}</h1><Link className="btn" href={`/content/${type}/new`}>New {def.label.toLowerCase()}</Link></div>
      {err && <p className="error" role="alert">{err}</p>}{msg && <p className="ok" role="status">{msg}</p>}
      {!rows ? <p>Loading…</p> : rows.length === 0 ? <p>Nothing here yet.</p> : (
        <table>
          <thead><tr><th /><th>{def.titleField === 'day' ? 'Date' : 'Title'}</th><th>Status</th><th /></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={key(r)}>
              <td><input type="checkbox" aria-label="Select for publishing" style={{ width: 'auto' }} checked={sel.has(key(r))} disabled={r.status === 'archived'} onChange={() => toggle(key(r))} /></td>
              <td><Link href={`/content/${type}/${key(r)}`}>{String(r[def.titleField] ?? key(r))}</Link></td>
              <td>
                <span className="badge">{r.status}</span>{' '}
                {r.has_unpublished_changes && <span className="badge warn">unpublished changes</span>}
              </td>
              <td />
            </tr>))}
          </tbody>
        </table>
      )}
      {sel.size > 0 && (
        <div className="card">
          <label htmlFor="note">Publish note (optional)</label>
          <input id="note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
          <p><button onClick={publish}>Publish {sel.size} selected</button></p>
          <p className="help">Publishing is all-or-nothing and needs the publisher role.</p>
        </div>
      )}
    </>
  );
}
