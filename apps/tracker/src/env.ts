import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  API_URL: z.url().default("http://localhost:3001"),
});

export const env = EnvSchema.parse(process.env);
