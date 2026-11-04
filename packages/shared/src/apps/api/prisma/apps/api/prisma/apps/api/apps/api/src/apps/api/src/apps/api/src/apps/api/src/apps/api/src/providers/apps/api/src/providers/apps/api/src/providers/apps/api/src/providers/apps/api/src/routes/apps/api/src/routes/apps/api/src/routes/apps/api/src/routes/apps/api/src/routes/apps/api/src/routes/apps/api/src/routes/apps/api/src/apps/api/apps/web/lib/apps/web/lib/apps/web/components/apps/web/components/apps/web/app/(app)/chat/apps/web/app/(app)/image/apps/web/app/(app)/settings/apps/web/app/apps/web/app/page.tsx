import Link from "next/link";

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6">
      <h1 className="text-5xl font-semibold tracking-tight">AI yang tidak mengintip.</h1>
      <p className="mt-4 text-lg text-white/60">
        Percakapan dan gambar disimpan terenkripsi di perangkat Anda.
        Tanpa akun pun bisa langsung pakai.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/chat" className="rounded-xl bg-white px-6 py-3 font-medium text-black">Mulai chat</Link>
        <Link href="/image" className="rounded-xl border border-white/15 px-6 py-3">Studio gambar</Link>
      </div>
    </main>
  );
}
