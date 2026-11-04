import type { StreamEvent } from "@v/shared";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`);
  return r.json();
}

export async function* streamChat(body: unknown, signal: AbortSignal): AsyncGenerator<StreamEvent> {
  const r = await fetch(`${BASE}/v1/chat/completions`, {
    method: "POST", credentials: "include", signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok || !r.body) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`);

  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) return;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const p of parts) {
      const line = p.trim();
      if (line.startsWith("data:")) yield JSON.parse(line.slice(5).trim());
    }
  }
}
