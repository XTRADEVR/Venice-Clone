import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db.js";
import { requireUser } from "../auth.js";

/** Server hanya menyimpan ciphertext — kunci tidak pernah dikirim. */
export default async function (app: FastifyInstance) {
  app.post("/v1/backups", async (req, reply) => {
    const u = await requireUser(req, reply);
    const { ciphertext, iv, salt } = z.object({
      ciphertext: z.string().min(1), iv: z.string(), salt: z.string()
    }).parse(req.body);

    const key = `backups/${u.id}/${Date.now()}.enc`;
    // produksi: unggah ke S3; dev: simpan inline
    const rec = await db.backup.create({
      data: { userId: u.id, key, size: ciphertext.length, iv, salt }
    });
    return { id: rec.id, key, size: rec.size };
  });

  app.get("/v1/backups/latest", async (req, reply) => {
    const u = await requireUser(req, reply);
    return db.backup.findFirst({
      where: { userId: u.id }, orderBy: { createdAt: "desc" }
    });
  });
             }
