import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db.js";
import { requireUser } from "../auth.js";
import { chargeCredits } from "../ratelimit.js";
import { imageProvider } from "../providers/index.js";

const body = z.object({
  model: z.string(),
  prompt: z.string().min(1).max(4000),
  negativePrompt: z.string().max(2000).optional(),
  width: z.number().int().min(256).max(2048).default(1024),
  height: z.number().int().min(256).max(2048).default(1024),
  seed: z.number().int().optional(),
  steps: z.number().int().min(1).max(60).optional(),
  cfg: z.number().min(1).max(20).optional()
});

export default async function (app: FastifyInstance) {
  app.post("/v1/images/generations", async (req, reply) => {
    const user = await requireUser(req, reply);
    const p = body.parse(req.body);

    const model = await db.model.findUnique({ where: { slug: p.model } });
    if (!model || model.kind !== "image") return reply.code(404).send({ error: "model gambar tidak ada" });

    const cost = model.creditsPerImage ?? 10;
    if (user.credits < cost) return reply.code(402).send({ error: "kredit tidak cukup" });

    const job = await db.generation.create({
      data: { userId: user.id, kind: "image", model: p.model, prompt: p.prompt,
              negative: p.negativePrompt, params: p as any, status: "running", credits: cost }
    });

    try {
      const { url } = await imageProvider.generate(p);
      await db.generation.update({ where: { id: job.id }, data: { status: "done", url } });
      const left = await chargeCredits(user.id, cost, "image", job.id);
      return { id: job.id, url, creditsLeft: left };
    } catch (e) {
      await db.generation.update({
        where: { id: job.id }, data: { status: "error", error: (e as Error).message }
      });
      return reply.code(502).send({ error: "generasi gagal", detail: (e as Error).message });
    }
  });

  app.get("/v1/images/history", async (req, reply) => {
    const user = await requireUser(req, reply);
    return db.generation.findMany({
      where: { userId: user.id, kind: "image" },
      orderBy: { createdAt: "desc" }, take: 60
    });
  });
  }
