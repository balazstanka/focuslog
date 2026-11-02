import express from "express";
import { PROTOCOL_VERSION } from "@focuslog/shared";

const app = express();
app.get("/health", (_req, res) => res.json({ ok: true, protocol: PROTOCOL_VERSION }));
app.listen(3001, () => console.log("API: http://localhost:3001"));