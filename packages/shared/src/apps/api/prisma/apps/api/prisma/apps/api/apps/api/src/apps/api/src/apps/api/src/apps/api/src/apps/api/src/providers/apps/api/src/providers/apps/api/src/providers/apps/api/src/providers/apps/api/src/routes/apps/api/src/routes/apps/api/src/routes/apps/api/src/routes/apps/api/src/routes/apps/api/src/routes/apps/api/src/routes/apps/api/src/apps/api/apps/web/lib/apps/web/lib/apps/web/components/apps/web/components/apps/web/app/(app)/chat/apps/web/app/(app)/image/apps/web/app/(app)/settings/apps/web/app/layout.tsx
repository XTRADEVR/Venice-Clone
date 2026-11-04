import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Venice Clone — AI privat",
  description: "Chat, gambar, dan suara. Privat secara default.",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="bg-neutral-950 text-white antialiased">{children}</body>
    </html>
  );
}
