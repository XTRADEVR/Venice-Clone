import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import { env } from "./env.js";
import auth from "./routes/auth.js";
import models from "./routes/models.js";
import chat from "./routes/chat.js";
import images from "./routes/images.js";
import conversations from "./routes/conversations.js";
import backups from "./routes/backups.js";
import token from "./routes/token.js";

const app = Fastify({ logger: true, trustProxy: true, bodyLimit: 12 * 1024 * 1024 });

await app.register(cookie);
await app.register(cors, { origin: env.APP_URL, credentials: true });
await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

app.get("/health", async () => ({ ok: true, ts: Date.now() }));

for (const r of [auth, models, chat, images, conversations, backups, token]) {
  await app.register(r);
}

app.setErrorHandler((err, _req, reply) => {
  if ((err as any).issues) return reply.code(422).send({ error: "validasi", issues: (err as any).issues });
  app.log.error(err);
  reply.code(err.statusCode ?? 500).send({ error: err.message });
});

app.listen({ port: env.PORT, host: "0.0.0.0" });
