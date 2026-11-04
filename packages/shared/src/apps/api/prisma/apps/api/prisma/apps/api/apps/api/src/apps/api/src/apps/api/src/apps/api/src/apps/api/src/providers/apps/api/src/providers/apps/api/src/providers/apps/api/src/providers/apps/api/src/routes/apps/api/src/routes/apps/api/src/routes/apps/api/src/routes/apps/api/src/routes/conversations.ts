import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db.js";
import { requireUser } from "../auth.js";

export default async function (app: FastifyInstance) {
  app.get("/v1/conversations", async (req, reply) => {
    const u = await requireUser(req, reply);
    return db.conversation.findMany({
      where: { userId: u.id }, orderBy: { updatedAt: "desc" }, take: 100,
      include: { messages: { orderBy: { createdAt: "asc" } } }
    });
  });

  app.post("/v1/conversations", async (req, reply) => {
    const u = await requireUser(req, reply);
    const { model, title } = z.object({
      model: z.string(), title: z.string().max(200).optional()
    }).parse(req.body);
    return db.conversation.create({ data: { userId: u.id, model, title: title ?? "Percakapan baru" } });
  });

  app.delete("/v1/conversations/:id", async (req, reply) => {
    const u = await requireUser(req, reply);
    const { id } = req.params as { id: string };
    await db.conversation.deleteMany({ where: { id, userId: u.id } });
    return { ok: true };
  });
}
