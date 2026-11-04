import type { FastifyInstance } from "fastify";
import { db } from "../db.js";

export default async function (app: FastifyInstance) {
  app.get("/v1/models", async (req) => {
    const kind = (req.query as any).kind as string | undefined;
    return db.model.findMany({
      where: { enabled: true, ...(kind ? { kind: kind as any } : {}) },
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }]
    });
  });
}
