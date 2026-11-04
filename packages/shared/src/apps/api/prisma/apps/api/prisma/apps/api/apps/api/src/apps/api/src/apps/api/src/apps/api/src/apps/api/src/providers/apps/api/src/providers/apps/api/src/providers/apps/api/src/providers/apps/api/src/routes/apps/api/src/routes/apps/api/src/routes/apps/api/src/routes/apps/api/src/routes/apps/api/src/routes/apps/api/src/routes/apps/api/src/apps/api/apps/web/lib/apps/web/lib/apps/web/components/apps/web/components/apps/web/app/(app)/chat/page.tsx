"use client";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage, Conversation, Me } from "@v/shared";
import { api, streamChat } from "@/lib/api";
import { store, uid } from "@/lib/store";
import Composer from "@/components/Composer";
import ModelPicker from "@/components/ModelPicker";

export default function ChatPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [model, setModel] = useState("venice-large");
  const [conv, setConv] = useState<Conversation | null>(null);
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<Me>("/v1/me").then(setMe).catch(() => {});
    (async () => {
      const list = (await store.all()).sort((a, b) => b.updatedAt - a.updatedAt);
      if (list[0]) { setConv(list[0]); setModel(list[0].model); }
    })();
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [conv?.messages]);

  const newChat = async () => {
    const c: Conversation = { id: uid(), title: "Percakapan baru", model,
      messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    await store.put(c); setConv(c);
  };

  const send = async (text: string, files: File[]) => {
    if (!conv) return;
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text, createdAt: Date.now() };
    const asstMsg: ChatMessage = { id: uid(), role: "assistant", content: "", createdAt: Date.now(), model };
    const base: Conversation = {
      ...conv, model,
      title: conv.messages.length === 0 ? text.slice(0, 60) : conv.title,
      messages: [...conv.messages, userMsg, asstMsg], updatedAt: Date.now()
    };
    setConv(base); await store.put(base);
    setBusy(true);

    const ac = new AbortController(); abort.current = ac;
    let acc = "";
    try {
      const serverConv = await api<{ id: string }>("/v1/conversations", {
        method: "POST", body: JSON.stringify({ model, title: base.title })
      }).catch(() => null);

      for await (const ev of streamChat({
        model, conversationId: serverConv?.id,
        messages: base.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
      }, ac.signal)) {
        if (ev.type === "delta") {
          acc += ev.text ?? "";
          const next = { ...base, messages: base.messages.map(m =>
            m.id === asstMsg.id ? { ...m, content: acc } : m) };
          setConv(next); await store.put(next);
        }
        if (ev.type === "error") acc += `\n\n_${ev.message}_`;
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") acc += `\n\n_${(e as Error).message}_`;
    } finally {
      setBusy(false); abort.current = null;
      const done = { ...base, messages: base.messages.map(m =>
        m.id === asstMsg.id ? { ...m, content: acc } : m) };
      setConv(done); await store.put(done);
      api<Me>("/v1/me").then(setMe).catch(() => {});
    }
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-white/10 p-3">
        <button onClick={newChat} className="rounded-lg bg-white/10 px-3 py-2 text-sm">+ Baru</button>
        <ModelPicker kind="chat" value={model} onChange={setModel} />
        <div className="ml-auto text-xs text-white/45">
          {me && `${me.credits} kredit · ${me.usedToday}/${me.dailyLimit} hari ini`}
        </div>
      </header>

      <div ref={scroller} className="flex-1 space-y-4 overflow-auto p-4">
        {conv?.messages.length === 0 && (
          <div className="mx-auto mt-24 max-w-md text-center text-white/50">
            <h1 className="mb-2 text-2xl font-semibold text-white">Mulai percakapan</h1>
            <p className="text-sm">Privat, tanpa iklan, tanpa filter di layer aplikasi.</p>
          </div>
        )}
        {conv?.messages.map(m => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
              m.role === "user" ? "bg-white text-black" : "bg-white/5"
            }`}>
              {m.content || (busy && "…")}
            </div>
          </div>
        ))}
      </div>

      <Composer onSend={send} busy={busy} onStop={() => abort.current?.abort()} />
    </div>
  );
      }
