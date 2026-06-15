// Backend (Express) ile konuşan ince HTTP katmanı.
// Korumalı uç noktalar için demo kullanıcısıyla bir kez giriş yapıp token önbelleğe alır.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

let token: string | null = null;

async function ensureToken(): Promise<string | null> {
  if (token) return token;
  try {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "ahmet", password: "orbis123" }),
    });
    if (r.ok) token = (await r.json()).token;
  } catch {
    /* backend kapalı */
  }
  return token;
}

interface Opts {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth) {
    const t = await ensureToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const r = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok) throw new Error(`API ${r.status}`);
  return (await r.json()) as T;
}

export const API_BASE = BASE;
