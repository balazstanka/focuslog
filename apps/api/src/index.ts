import express from "express";
import { PROTOCOL_VERSION, SampleBatchSchema } from "@focuslog/shared";

const app = express();
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

app.listen(3001, () => console.log("API: http://localhost:3001"));