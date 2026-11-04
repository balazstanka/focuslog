import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { PROTOCOL_VERSION, SampleBatchSchema } from "@focuslog/shared";
import { auth } from "./lib/auth";
import { env } from "./env";

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.all("/api/auth/*splat", toNodeHandler(auth)); // az express.json() ELŐTT
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, protocol: PROTOCOL_VERSION }));
app.post("/samples", (req, res) => {
  const result = SampleBatchSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }
  console.log("received " + result.data.length + " samples");
  res.json([]);
});

app.listen(env.PORT, () => console.log(`API: http://localhost:${env.PORT}`));
