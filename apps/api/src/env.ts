import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3001),
});

export const env = EnvSchema.parse(process.env);
