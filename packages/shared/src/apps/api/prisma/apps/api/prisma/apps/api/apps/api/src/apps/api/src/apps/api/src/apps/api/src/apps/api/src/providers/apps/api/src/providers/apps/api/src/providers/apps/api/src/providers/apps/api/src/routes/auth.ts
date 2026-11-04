import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "../db.js";
import { ensureUser, requireUser, setSession } from "../auth.js";

const creds = z.object({ email: z.string().email(), password: z.string().min(10) });

export default async function (app: FastifyInstance) {
  app.post("/v1/auth/anon", async (req, reply) => {
    const u = await ensureUser(req, reply);
    return { id: u.id, anon: u.anon, tier: u.tier };
  });

  app.post("/v1/auth/register", async (req, reply) => {
    const { email, password } = creds.parse(req.body);
    if (await db.user.findUnique({ where: { email } }))
      return reply.code(409).send({ error: "email sudah terdaftar" });
    const passHash = await argon2.hash(password);
    const anon = await ensureUser(req, reply);      // upgrade sesi anonim
    const u = await db.user.update({
      where: { id: anon.id }, data: { email, passHash, anon: false, tier: "FREE", credits: 1000 }
    });
    await setSession(reply, u.id);
    return { id: u.id, tier: u.tier, email: u.email };
  });

  app.post("/v1/auth/login", async (req, reply) => {
    const { email, password } = creds.parse(req.body);
    const u = await db.user.findUnique({ where: { email } });
    if (!u?.passHash || !(await argon2.verify(u.passHash, password)))
      return reply.code(401).send({ error: "kredensial salah" });
    await setSession(reply, u.id);
    return { id: u.id, tier: u.tier, email: u.email };
  });

  app.post("/v1/auth/logout", async (_req, reply) => {
    reply.clearCookie("v_session", { path: "/" });
    return { ok: true };
  });

  app.get("/v1/me", async (req, reply) => {
    const u = await requireUser(req, reply);
    const { peekQuota } = await import("../ratelimit.js");
    const q = await peekQuota(u);
    return { id: u.id, tier: u.tier, email: u.email, anon: u.anon,
             credits: u.credits, usedToday: q.used, dailyLimit: q.limit };
  });
           }
