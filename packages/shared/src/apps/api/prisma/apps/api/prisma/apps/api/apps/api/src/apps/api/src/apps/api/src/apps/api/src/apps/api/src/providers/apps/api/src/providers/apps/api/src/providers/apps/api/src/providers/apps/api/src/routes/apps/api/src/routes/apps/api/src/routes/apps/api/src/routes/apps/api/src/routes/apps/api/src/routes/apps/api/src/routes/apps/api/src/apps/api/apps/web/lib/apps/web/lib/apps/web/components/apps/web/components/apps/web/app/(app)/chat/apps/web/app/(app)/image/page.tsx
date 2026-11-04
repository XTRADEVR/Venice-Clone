"use client";
import { useEffect, useState } from "react";
import type { ImageJob } from "@v/shared";
import { api } from "@/lib/api";
import { store, uid } from "@/lib/store";
import ModelPicker from "@/components/ModelPicker";

const RATIOS: [string, number, number][] = [
  ["1:1", 1024, 1024], ["16:9", 1344, 768], ["9:16", 768, 1344], ["4:3", 1152, 864]
];

export default function ImagePage() {
  const [model, setModel] = useState("venice-image");
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("");
  const [ratio, setRatio] = useState(0);
  const [seed, setSeed] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => { store.images().then(j => setJobs(j.sort((a, b) => b.createdAt - a.createdAt))); }, []);

  const run = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true); setErr("");
    const [, w, h] = RATIOS[ratio];
    const job: ImageJob = { id: uid(), prompt, negativePrompt: negative, model,
      width: w, height: h, seed: seed ? Number(seed) : undefined,
      status: "running", createdAt: Date.now() };
    setJobs(j => [job, ...j]); await store.putImage(job);

    try {
      const r = await api<{ url: string }>("/v1/images/generations", {
        method: "POST",
        body: JSON.stringify({ model, prompt, negativePrompt: negative || undefined,
          width: w, height: h, seed: seed ? Number(seed) : undefined })
      });
      const done = { ...job, status: "done" as const, url: r.url };
      setJobs(j => j.map(x => x.id === job.id ? done : x)); await store.putImage(done);
    } catch (e) {
      const bad = { ...job, status: "error" as const, error: (e as Error).message };
      setJobs(j => j.map(x => x.id === job.id ? bad : x)); await store.putImage(bad);
      setErr((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Studio Gambar</h1>
      <div className="grid gap-4 md:grid-cols-[340px_1fr]">
        <div className="space-y-3 rounded-2xl border border-white/10 p-4">
          <ModelPicker kind="image" value={model} onChange={setModel} />
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5}
            placeholder="Deskripsi gambar…"
            className="w-full rounded-xl bg-white/5 p-3 text-sm outline-none" />
          <textarea value={negative} onChange={e => setNegative(e.target.value)} rows={2}
            placeholder="Negative prompt (opsional)"
            className="w-full rounded-xl bg-white/5 p-3 text-sm outline-none" />
          <div className="flex gap-2">
            {RATIOS.map(([l], i) => (
              <button key={l} onClick={() => setRatio(i)}
                className={`flex-1 rounded-lg py-1.5 text-xs ${i === ratio ? "bg-white text-black" : "bg-white/10"}`}>
                {l}
              </button>
            ))}
          </div>
          <input value={seed} onChange={e => setSeed(e.target.value)} placeholder="Seed (opsional)"
            className="w-full rounded-xl bg-white/5 p-2 text-sm outline-none" />
          <button onClick={run} disabled={busy || !prompt.trim()}
            className="w-full rounded-xl bg-white py-2.5 font-medium text-black disabled:opacity-40">
            {busy ? "Membuat…" : "Generate"}
          </button>
          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>

        <div className="grid auto-rows-min grid-cols-2 gap-3 md:grid-cols-3">
          {jobs.map(j => (
            <div key={j.id} className="overflow-hidden rounded-xl border border-white/10">
              {j.status === "done" && j.url
                ? <img src={j.url} alt={j.prompt} className="aspect-square w-full object-cover" />
                : <div className="flex aspect-square items-center justify-center bg-white/5 text-xs text-white/50">
                    {j.status === "error" ? j.error : "…"}
                  </div>}
              <p className="line-clamp-2 p-2 text-[11px] text-white/60">{j.prompt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
                                   }
