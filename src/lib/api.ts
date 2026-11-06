import { supabase } from './supabase';

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) { super(`API ${status}`); }
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError(401, null);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    method: init.method ?? 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}
const safeJson = (t: string) => { try { return JSON.parse(t); } catch { return t; } };

/** Turns an API error into a message a content editor can act on. */
export function describeError(e: unknown): string {
  if (!(e instanceof ApiError)) return 'Something went wrong. Please try again.';
  const b = e.body as { code?: string; problems?: { type: string; messages: string[] }[]; issues?: { path: string; message: string }[] } | null;
  if (e.status === 401) return 'Your session has expired. Please sign in again.';
  if (e.status === 403) return 'Your role does not allow this action.';
  if (e.status === 409) return 'This item was changed by someone else (or is archived). Reload and try again.';
  if (e.status === 422 && b?.problems) return b.problems.map((p) => `${p.type}: ${p.messages.join('; ')}`).join(' | ');
  if (b?.issues?.length) return b.issues.map((i) => `${i.path || 'field'}: ${i.message}`).join('; ');
  if (b?.code === 'unsupported_type') return 'That file type is not allowed.';
  if (b?.code === 'too_large') return 'That file is too large for its type.';
  if (e.status === 400) return 'Some fields are missing or invalid.';
  return `Request failed (${e.status}).`;
}
