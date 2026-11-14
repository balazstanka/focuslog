import { z } from "zod";

const EnvSchema = z.object({
  API_URL: z
    .url({ protocol: /^https?$/ })
    .default("http://localhost:3001")
    .transform((url) => url.replace(/\/+$/, "")),
});

export const env = EnvSchema.parse(process.env);
