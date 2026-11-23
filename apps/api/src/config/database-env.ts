import { z } from "zod";

export const DatabaseEnvSchema = z.object({
  DATABASE_PROVIDER: z.enum(["sqlite", "postgresql"]).default("sqlite"),
  DATABASE_URL: z.string().min(1),
});

export type DatabaseProvider = z.infer<typeof DatabaseEnvSchema>["DATABASE_PROVIDER"];
