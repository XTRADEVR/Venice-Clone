import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const models = [
  { slug: "venice-large", label: "Venice Large", vendor: "venice", kind: "chat",
    description: "Model flagship untuk penalaran kompleks dan tulisan panjang.",
    contextWindow: 200000, creditsPer1kIn: 1.2, creditsPer1kOut: 3.6,
    nsfw: true, tierRequired: "ANON", capabilities: ["vision", "tools"], sortOrder: 10 },
  { slug: "venice-fast", label: "Venice Fast", vendor: "venice", kind: "chat",
    description: "Latensi rendah untuk percakapan sehari-hari.",
    contextWindow: 32000, creditsPer1kIn: 0.2, creditsPer1kOut: 0.6,
    nsfw: true, tierRequired: "ANON", capabilities: [], sortOrder: 20 },
  { slug: "venice-reasoning", label: "Venice Reasoning", vendor: "venice", kind: "chat",
    description: "Chain-of-thought eksplisit untuk matematika dan kode.",
    contextWindow: 128000, creditsPer1kIn: 2, creditsPer1kOut: 8,
    nsfw: false, tierRequired: "FREE", capabilities: ["tools"], sortOrder: 30 },
  { slug: "venice-image", label: "Venice Image", vendor: "venice", kind: "image",
    description: "Generator gambar serbaguna, kuat untuk fotorealisme.",
    contextWindow: null, creditsPerImage: 12, nsfw: true,
    tierRequired: "ANON", capabilities: ["negative_prompt", "seed"], sortOrder: 10 },
  { slug: "venice-anime", label: "Venice Anime", vendor: "venice", kind: "image",
    description: "Gaya ilustrasi dan anime.",
    contextWindow: null, creditsPerImage: 8, nsfw: true,
    tierRequired: "FREE", capabilities: ["negative_prompt"], sortOrder: 20 },
  { slug: "venice-tts", label: "Venice Voice", vendor: "venice", kind: "tts",
    description: "Text to speech natural multi-bahasa.",
    contextWindow: null, creditsPer1kOut: 5, nsfw: false,
    tierRequired: "FREE", capabilities: [], sortOrder: 10 }
] as const;

async function main() {
  for (const m of models) {
    await db.model.upsert({ where: { slug: m.slug }, update: m, create: m as any });
  }
  console.log(`Seeded ${models.length} models`);
}
main().finally(() => db.$disconnect());
