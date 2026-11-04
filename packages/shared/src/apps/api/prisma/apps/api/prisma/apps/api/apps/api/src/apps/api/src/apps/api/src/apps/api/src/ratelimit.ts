import { db } from "./db.js";
import { LIMITS } from "./env.js";
import type { User } from "@prisma/client";

const today = () => new Date().toISOString().slice(0, 10);

export async function consumeQuota(user: User) {
  const day = today();
  const rec = await db.dailyUsage.upsert({
    where: { userId_day: { userId: user.id, day } },
    update: { count: { increment: 1 } },
    create: { userId: user.id, day, count: 1 }
  });
  const limit = LIMITS[user.tier] ?? LIMITS.ANON;
  return { used: rec.count, limit, ok: rec.count <= limit };
}

export async function peekQuota(user: User) {
  const day = today();
  const rec = await db.dailyUsage.findUnique({
    where: { userId_day: { userId: user.id, day } }
  });
  return { used: rec?.count ?? 0, limit: LIMITS[user.tier] ?? LIMITS.ANON };
}

export async function chargeCredits(userId: string, amount: number, reason: string, ref?: string) {
  if (amount <= 0) return 0;
  const u = await db.user.update({
    where: { id: userId },
    data: { credits: { decrement: amount } }
  });
  await db.creditLedger.create({ data: { userId, delta: -amount, reason, ref } });
  return u.credits;
           }
