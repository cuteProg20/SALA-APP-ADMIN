'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, describeError } from '@/lib/api';
import { entityDef, SECTION_KINDS, toBody, type Field } from '@/lib/schema';

type Section = { kind: string; citation: string; body: string; position: number };
type Vals = Record<string, string | boolean>;

export default function Edit({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = use(params);
  const def = entityDef(type); const router = useRouter();
  const creating = id === 'new';
  const [vals, setVals] = useState<Vals>({}); const [sections, setSections] = useState<Section[]>([]);
  const [meta, setMeta] = useState<{ status: string; version: number } | null>(null);
  const [err, setErr] = useState(''); const [msg, setMsg] = useState(''); const [loaded, setLoaded] = useState(creating);

  useEffect(() => {
    if (creating || !def) return;
    api<Record<string, unknown> & { status: string; version: number; sections?: Section[] }>(`/v1/admin/content/${type}/${id}`).then((r) => {
      const v: Vals = {};
      for (const f of def.fields) {
        const x = r[f.name];
        v[f.name] = f.type === 'boolean' ? x === true : f.type === 'datetime' && typeof x === 'string' ? x.slice(0, 16) : x == null ? '' : String(x);
      }
      setVals(v); setSections(r.sections ?? []); setMeta({ status: r.status, version: r.version }); setLoaded(true);
    }).catch((e) => setErr(describeError(e)));
  }, [creating, def, type, id]);

  if (!def) return <p>Unknown content type.</p>;
  if (!loaded) return err ? <p className="error" role="alert">{err}</p> : <p>Loading…</p>;

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setMsg('');
    const body: Record<string, unknown> = toBody(def!, vals, !creating);
    if (def!.hasSections) body.sections = sections;
    try {
      if (creating) {
        const r = await api<{ id?: string; day?: string }>(`/v1/admin/content/${type}`, { method: 'POST', body });
        router.replace(`/content/${type}/${r.id ?? r.day}`);
      } else {
        const r = await api<{ version: number; status: string }>(`/v1/admin/content/${type}/${id}`, { method: 'PATCH', body });
        setMeta({ version: r.version, status: r.status }); setMsg('Saved as a draft. Publish from the list to make it live.');
      }
    } catch (e) { setErr(describeError(e)); }
  }
  async function unpublish(archive: boolean) {
    if (!confirm(archive ? 'Remove from the app and archive? Archived items cannot be edited.' : 'Remove from the app? It returns to draft.')) return;
    try { await api(`/v1/admin/content/${type}/${id}/unpublish`, { method: 'POST', body: { archive } }); router.replace(`/content/${type}`); } catch (e) { setErr(describeError(e)); }
  }
  const set = (n: string, v: string | boolean) => setVals((s) => ({ ...s, [n]: v }));
  const upd = (i: number, p: Partial<Section>) => setSections((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));

  const input = (f: Field) => {
    const v = vals[f.name]; const common = { id: f.name, required: f.required, disabled: !creating && f.lockedOnEdit };
    if (f.type === 'textarea') return <textarea {...common} value={String(v ?? '')} onChange={(e) => set(f.name, e.target.value)} />;
    if (f.type === 'boolean') return <input {...common} type="checkbox" style={{ width: 'auto' }} checked={v === true} onChange={(e) => set(f.name, e.target.checked)} />;
    if (f.type === 'select') return <select {...common} value={String(v ?? '')} onChange={(e) => set(f.name, e.target.value)}><option value="">—</option>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>;
    const t = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'datetime' ? 'datetime-local' : 'text';
    return <input {...common} type={t} value={String(v ?? '')} onChange={(e) => set(f.name, e.target.value)} />;
  };

  return (
    <form onSubmit={save}>
      <h1>{creating ? `New ${def.label.toLowerCase()}` : def.label}</h1>
      {meta && <p><span className="badge">{meta.status}</span> <span className="help">version {meta.version}</span></p>}
      {def.fields.map((f) => (
        <div key={f.name}><label htmlFor={f.name}>{f.label}{f.required ? ' *' : ''}</label>{input(f)}{f.help && <div className="help">{f.help}</div>}</div>
      ))}
      {def.hasSections && (
        <>
          <h2>Reading sections</h2><p className="help">A Gospel section is required to publish. Each kind may appear once.</p>
          {sections.map((s, i) => (
            <div className="card" key={i}>
              <div className="row">
                <select aria-label="Section kind" value={s.kind} onChange={(e) => upd(i, { kind: e.target.value })}>{SECTION_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
                <input aria-label="Citation" placeholder="e.g. Luke 13:10-17" value={s.citation} onChange={(e) => upd(i, { citation: e.target.value })} />
                <button type="button" className="secondary" onClick={() => setSections((x) => x.filter((_, j) => j !== i))}>Remove</button>
              </div>
              <textarea aria-label="Text" value={s.body} onChange={(e) => upd(i, { body: e.target.value })} />
            </div>))}
          <button type="button" className="secondary" onClick={() => setSections((s) => [...s, { kind: 'gospel', citation: '', body: '', position: s.length }])}>Add section</button>
        </>
      )}
      {err && <p className="error" role="alert">{err}</p>}{msg && <p className="ok" role="status">{msg}</p>}
      <p className="row"><button>Save draft</button>
        {!creating && meta?.status === 'published' && <button type="button" className="danger" onClick={() => unpublish(false)}>Unpublish</button>}
        {!creating && meta?.status !== 'archived' && <button type="button" className="secondary" onClick={() => unpublish(true)}>Archive</button>}
        <button type="button" className="secondary" onClick={() => router.push(`/content/${type}`)}>Back</button></p>
    </form>
  );
}
