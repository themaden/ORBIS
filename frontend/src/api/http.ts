// Backend (Express) ile konuşan ince HTTP katmanı.
// Backend cevap vermezse mock veriyle çalışır (Vercel demo modu).
import { getMock } from "./mocks";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const FORCE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

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
  if (FORCE_MOCK) {
    const mock = getMock(path);
    if (mock !== undefined) return mock as T;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth) {
    const t = await ensureToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  try {
    const r = await fetch(`${BASE}${path}`, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!r.ok) throw new Error(`API ${r.status}`);
    return (await r.json()) as T;
  } catch (err) {
    const mock = getMock(path);
    if (mock !== undefined) {
      if (import.meta.env.DEV) {
        console.warn(`[mock fallback] ${path}`);
      }
      return mock as T;
    }
    throw err;
  }
}

export const API_BASE = BASE;
