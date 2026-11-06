'use client';
import { useState } from 'react';
import { api, describeError } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type Up = { asset_id: string; token: string; path: string };

export default function Media() {
  const [file, setFile] = useState<File | null>(null); const [license, setLicense] = useState('');
  const [url, setUrl] = useState(''); const [kind, setKind] = useState('video'); const [license2, setLicense2] = useState('');
  const [result, setResult] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  async function upload(e: React.FormEvent) {
    e.preventDefault(); if (!file) return; setBusy(true); setErr(''); setResult('');
    try {
      const up = await api<Up>('/v1/admin/media/upload-url', { method: 'POST', body: { mime_type: file.type, bytes: file.size, license_note: license } });
      const { error } = await supabase().storage.from('published-media').uploadToSignedUrl(up.path, up.token, file, { contentType: file.type });
      if (error) throw new Error('upload');
      setResult(up.asset_id);
    } catch (e) { setErr(e instanceof Error && e.message === 'upload' ? 'The file could not be uploaded. Try again.' : describeError(e)); }
    setBusy(false);
  }
  async function link(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(''); setResult('');
    try { setResult((await api<{ asset_id: string }>('/v1/admin/media/external', { method: 'POST', body: { url, kind, license_note: license2 } })).asset_id); }
    catch (e) { setErr(describeError(e)); }
    setBusy(false);
  }
  return (
    <>
      <h1>Media</h1>
      <p className="help">Upload a file or register a hosted link, then paste the resulting asset id into the content form. A licence / permission note is required for every item.</p>
      {err && <p className="error" role="alert">{err}</p>}
      {result && <p className="ok" role="status">Asset id: <code>{result}</code></p>}
      <form className="card" onSubmit={upload}>
        <h2>Upload file</h2>
        <p className="help">JPEG/PNG/WebP up to 5 MB, MP3/M4A up to 100 MB, MP4 up to 500 MB, PDF up to 50 MB.</p>
        <label htmlFor="f">File</label><input id="f" type="file" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <label htmlFor="l">Licence / permission note</label><input id="l" required minLength={3} value={license} onChange={(e) => setLicense(e.target.value)} />
        <p><button disabled={busy}>Upload</button></p>
      </form>
      <form className="card" onSubmit={link}>
        <h2>Register hosted link (https)</h2>
        <label htmlFor="u">URL</label><input id="u" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} />
        <label htmlFor="k">Kind</label><select id="k" value={kind} onChange={(e) => setKind(e.target.value)}><option>video</option><option>audio</option></select>
        <label htmlFor="l2">Licence / permission note</label><input id="l2" required minLength={3} value={license2} onChange={(e) => setLicense2(e.target.value)} />
        <p><button disabled={busy}>Register link</button></p>
      </form>
    </>
  );
}
