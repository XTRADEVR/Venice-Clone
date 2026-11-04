import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db.js";
import { requireUser } from "../auth.js";
import { consumeQuota, chargeCredits } from "../ratelimit.js";
import { chatProvider } from "../providers/index.js";

const body = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string()
  })).min(1),
  conversationId: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(32000).optional()
});

export default async function (app: FastifyInstance) {
  app.post("/v1/chat/completions", async (req, reply) => {
    const user = await requireUser(req, reply);
    const p = body.parse(req.body);

    const model = await db.model.findUnique({ where: { slug: p.model } });
    if (!model || !model.enabled) return reply.code(404).send({ error: "model tidak tersedia" });
    if (model.kind !== "chat") return reply.code(400).send({ error: "bukan model chat" });

    const q = await consumeQuota(user);
    if (!q.ok) return reply.code(429).send({
      error: "kuota harian habis", used: q.used, limit: q.limit
    });

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    const send = (obj: unknown) => reply.raw.write(`data: ${JSON.stringify(obj)}\n\n`);

    const ac = new AbortController();
    req.raw.on("close", () => ac.abort());

    let full = "";
    let tin = 0, tout = 0;

    try {
      for await (const chunk of chatProvider.stream({
        model: p.model, messages: p.messages,
        temperature: p.temperature, maxTokens: p.maxTokens, signal: ac.signal
      })) {
        if (chunk.delta) { full += chunk.delta; send({ type: "delta", text: chunk.delta }); }
        if (chunk.tokensIn) tin = chunk.tokensIn;
        if (chunk.tokensOut) tout = chunk.tokensOut;
      }

      if (!tout) tout = Math.ceil(full.length / 4);
      if (!tin) tin = Math.ceil(p.messages.map(m => m.content).join(" ").length / 4);

      const cost = Math.ceil(
        (tin / 1000) * model.creditsPer1kIn + (tout / 1000) * model.creditsPer1kOut
      );
      const left = await chargeCredits(user.id, cost, "chat", model.slug);

      if (p.conversationId) {
        const conv = await db.conversation.findFirst({
          where: { id: p.conversationId, userId: user.id }
        });
        if (conv) {
          const lastUser = p.messages.at(-1);
          await db.message.createMany({ data: [
            { conversationId: conv.id, role: "user", content: lastUser!.content },
            { conversationId: conv.id, role: "assistant", content: full,
              tokensIn: tin, tokensOut: tout }
          ]});
          await db.conversation.update({
            where: { id: conv.id },
            data: { updatedAt: new Date(), title: conv.title === "Percakapan baru"
              ? lastUser!.content.slice(0, 60) : conv.title }
          });
        }
      }

      send({ type: "usage", tokensIn: tin, tokensOut: tout, creditsLeft: left });
      send({ type: "done" });
    } catch (e) {
      send({ type: "error", message: (e as Error).message });
    } finally {
      reply.raw.end();
    }
  });
      }
