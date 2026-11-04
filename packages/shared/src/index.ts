import { z } from "zod";

export const PROTOCOL_VERSION = 1;

export const WindowSampleSchema = z.object({
    title: z.string().min(1).max(1024),
    name: z.string().min(1).max(256),
});

export const SampleBatchSchema = z.array(WindowSampleSchema).max(50);

export type WindowSample = z.infer<typeof WindowSampleSchema>;

export type SampleBatch = z.infer<typeof SampleBatchSchema>;