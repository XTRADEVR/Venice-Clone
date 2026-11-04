"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { encryptJSON } from "@/lib/crypto";
import { store } from "@/lib/store";

export default function SettingsPage() {
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  const backup = async () => {
    if (pass.length < 12) return setMsg("Passphrase minimal 12 karakter.");
    const payload = { conversations: await store.all(), images: await store.images() };
    const box = await encryptJSON(pass, payload);
    await api("/v1/backups", { method: "POST", body: JSON.stringify(box) });
    setMsg("Backup terenkripsi terkirim. Server tidak bisa membukanya.");
  };

  const wipe = async () => {
    await store.clear(); setMsg("Data lokal dihapus.");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Pengaturan</h1>

      <section className="space-y-3 rounded-2xl border border-white/10 p-4">
        <h2 className="font-medium">Backup terenkripsi</h2>
        <p className="text-sm text-white/50">
          Data dienkripsi AES-256-GCM di browser dengan PBKDF2 310k iterasi.
          Hanya ciphertext yang dikirim ke server.
        </p>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)}
          placeholder="Passphrase backup"
          className="w-full rounded-xl bg-white/5 p-3 text-sm outline-none" />
        <button onClick={backup} className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black">
          Buat backup
        </button>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 p-4">
        <h2 className="font-medium">Data lokal</h2>
        <p className="text-sm text-white/50">Semua percakapan dan gambar tersimpan di IndexedDB perangkat ini.</p>
        <button onClick={wipe} className="rounded-xl bg-red-500/80 px-4 py-2 text-sm">Hapus semua data</button>
      </section>

      {msg && <p className="text-sm text-emerald-400">{msg}</p>}
    </div>
  );
        }
