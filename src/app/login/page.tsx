'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const { error } = await supabase().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError('Sign-in failed. Check your email and password.'); // same message for every cause
    router.replace('/');
  }
  return (
    <main style={{ maxWidth: 380, margin: '10vh auto' }}>
      <h1>SALA Admin</h1>
      <form onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="error" role="alert">{error}</p>}
        <p><button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></p>
      </form>
      <p className="help">Staff accounts are created by a super admin. Access is checked by the server on every action.</p>
    </main>
  );
}
