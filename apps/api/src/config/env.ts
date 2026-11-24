import "dotenv/config";
import { z } from "zod";
import { DatabaseEnvSchema } from "./database-env";

const EnvSchema = DatabaseEnvSchema.extend({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  PORT: z.coerce.number().default(3001),
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
});

export const env = EnvSchema.parse(process.env);
