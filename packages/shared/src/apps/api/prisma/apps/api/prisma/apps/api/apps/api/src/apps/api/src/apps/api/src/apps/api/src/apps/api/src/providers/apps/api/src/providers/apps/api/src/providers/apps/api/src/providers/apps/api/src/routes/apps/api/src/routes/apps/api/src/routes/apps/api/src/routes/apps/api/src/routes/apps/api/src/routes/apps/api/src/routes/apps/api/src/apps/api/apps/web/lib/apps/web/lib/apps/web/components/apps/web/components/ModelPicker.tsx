"use client";
import { useEffect, useState } from "react";
import type { Model } from "@v/shared";
import { api } from "@/lib/api";

export default function ModelPicker({ kind, value, onChange }: {
  kind: "chat" | "image";
  value: string;
  onChange: (slug: string) => void;
}) {
  const [models, setModels] = useState<Model[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api<Model[]>(`/v1/models?kind=${kind}`).then(setModels).catch(() => {});
  }, [kind]);

  const current = models.find(m => m.slug === value);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
        {current?.label ?? "Pilih model"} <span className="text-white/40">▾</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 max-h-80 w-80 overflow-auto rounded-xl border border-white/10 bg-neutral-900 p-1 shadow-2xl">
          {models.map(m => (
            <button key={m.slug}
              onClick={() => { onChange(m.slug); setOpen(false); }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10">
              <div className="flex items-center justify-between">
                <span>{m.label}</span>
                {m.nsfw && <span className="rounded bg-pink-500/20 px-1.5 text-[10px] text-pink-300">NSFW</span>}
              </div>
              <p className="text-xs text-white/45">{m.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
                }
