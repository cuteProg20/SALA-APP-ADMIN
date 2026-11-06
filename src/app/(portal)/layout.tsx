'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ENTITIES } from '@/lib/schema';

export default function Portal({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const path = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase().auth.onAuthStateChange((_e, session) => { if (!session) router.replace('/login'); });
    supabase().auth.getSession().then(({ data }) => { if (!data.session) router.replace('/login'); else setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (!ready) return <p style={{ padding: 24 }}>Loading…</p>;
  const cur = (href: string) => (path.startsWith(href) ? 'page' : undefined);
  return (
    <div className="shell">
      <nav className="side" aria-label="Main">
        <b style={{ padding: '8px 10px' }}>SALA Admin</b>
        {ENTITIES.map((e) => <Link key={e.type} href={`/content/${e.type}`} aria-current={cur(`/content/${e.type}`)}>{e.plural}</Link>)}
        <Link href="/media" aria-current={cur('/media')}>Media upload</Link>
        <button className="secondary" style={{ marginTop: 'auto' }} onClick={() => supabase().auth.signOut()}>Sign out</button>
      </nav>
      <main>{children}</main>
    </div>
  );
}
