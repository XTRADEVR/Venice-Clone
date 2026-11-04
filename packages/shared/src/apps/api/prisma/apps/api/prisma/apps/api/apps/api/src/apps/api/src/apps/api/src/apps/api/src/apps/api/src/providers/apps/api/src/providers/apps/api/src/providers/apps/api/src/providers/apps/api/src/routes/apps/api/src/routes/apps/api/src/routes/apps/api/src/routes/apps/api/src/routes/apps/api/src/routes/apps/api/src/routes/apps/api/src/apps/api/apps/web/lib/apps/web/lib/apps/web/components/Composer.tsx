"use client";
import { useRef, useState } from "react";

export default function Composer({ onSend, busy, onStop }: {
  onSend: (text: string, files: File[]) => void;
  busy: boolean;
  onStop: () => void;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const ta = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    if (!text.trim() || busy) return;
    onSend(text.trim(), files);
    setText(""); setFiles([]);
    if (ta.current) ta.current.style.height = "auto";
  };

  return (
    <div className="sticky bottom-0 border-t border-white/10 bg-neutral-950/80 p-3 backdrop-blur">
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span key={i} className="rounded-full bg-white/10 px-3 py-1 text-xs">
              {f.name}
              <button className="ml-2 text-white/50"
                onClick={() => setFiles(files.filter((_, x) => x !== i))}>×</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
        <label className="cursor-pointer px-2 py-1 text-white/50 hover:text-white" title="Lampirkan">
          <input type="file" multiple hidden
            onChange={e => setFiles([...files, ...Array.from(e.target.files ?? [])])} />
          +
        </label>
        <textarea
          ref={ta} rows={1} value={text}
          onChange={e => {
            setText(e.target.value);
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 200) + "px";
          }}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          placeholder="Tanya apa saja…"
          className="max-h-52 flex-1 resize-none bg-transparent px-2 py-2 outline-none"
        />
        {busy
          ? <button onClick={onStop} className="rounded-xl bg-red-500/80 px-4 py-2 text-sm">Stop</button>
          : <button onClick={submit} disabled={!text.trim()}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-40">
              Kirim
            </button>}
      </div>
      <p className="mt-2 text-center text-[11px] text-white/35">
        Riwayat disimpan terenkripsi di perangkat ini.
      </p>
    </div>
  );
      }
