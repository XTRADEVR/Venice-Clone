import { SignJWT, jwtVerify } from "jose";
import type { FastifyRequest, FastifyReply } from "fastify";
import { env } from "./env.js";
import { db } from "./db.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);
const COOKIE = "v_session";

export async function issueToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function setSession(reply: FastifyReply, userId: string) {
  reply.setCookie(COOKIE, await issueToken(userId), {
    httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 30
  });
}

export async function getUserId(req: FastifyRequest): Promise<string | null> {
  const raw = req.cookies[COOKIE];
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secret);
    return String(payload.sub);
  } catch { return null; }
}

/** Anonymous device session — dibuat otomatis, tanpa tembok login. */
export async function ensureUser(req: FastifyRequest, reply: FastifyReply) {
  const id = await getUserId(req);
  if (id) {
    const u = await db.user.findUnique({ where: { id } });
    if (u) return u;
  }
  const u = await db.user.create({
    data: {
      anon: true,
      devices: { create: {
        userAgent: req.headers["user-agent"]?.slice(0, 255),
        ipHash: hashIp(req.ip)
      } }
    }
  });
  await setSession(reply, u.id);
  return u;
}

export function hashIp(ip: string) {
  let h = 0;
  for (let i = 0; i < ip.length; i++) h = (h * 31 + ip.charCodeAt(i)) | 0;
  return `h${h}`;
}

export async function requireUser(req: FastifyRequest, reply: FastifyReply) {
  const u = await ensureUser(req, reply);
  return u;
}
