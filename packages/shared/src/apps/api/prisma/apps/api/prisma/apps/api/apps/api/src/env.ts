import { z } from "zod";
const S = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8080),
  APP_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  CHAT_PROVIDER: z.enum(["openai", "mock"]).default("mock"),
  OPENAI_BASE_URL: z.string().default("https://api.openai.com/v1"),
  OPENAI_API_KEY: z.string().optional(),
  IMAGE_PROVIDER: z.enum(["openai", "mock"]).default("mock"),
  IMAGE_MODEL: z.string().default("gpt-image-1"),
  ANON_DAILY_MESSAGES: z.coerce.number().default(15),
  FREE_DAILY_MESSAGES: z.coerce.number().default(50),
  PRO_DAILY_MESSAGES: z.coerce.number().default(1000)
});
export const env = S.parse(process.env);
export const LIMITS: Record<string, number> = {
  ANON: env.ANON_DAILY_MESSAGES,
  FREE: env.FREE_DAILY_MESSAGES,
  PRO: env.PRO_DAILY_MESSAGES,
  PRO_PLUS: env.PRO_DAILY_MESSAGES * 4,
  MAX: Infinity
};
