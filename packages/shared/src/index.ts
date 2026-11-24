import { z } from "zod";

export const PROTOCOL_VERSION = 1;

export const HealthResponseSchema = z.object({
  ok: z.boolean(),
  protocol: z.number().int().positive(),
});

export const CurrentUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export type CurrentUser = z.infer<typeof CurrentUserSchema>;

const EpochMsSchema = z.number().int().positive();

const MIN_SESSION_DURATION_MS = 60_000;
const MAX_SESSION_DURATION_MS = 4 * 60 * 60_000;
const MAX_SESSION_RANGE_MS = 31 * 24 * 60 * 60_000;

export const SessionStatusSchema = z.enum(["running", "paused", "finished", "cancelled"]);

export const SessionKindSchema = z.enum(["work", "break"]);

export const SessionPauseSchema = z.object({
  startedAt: EpochMsSchema,
  endedAt: EpochMsSchema.nullable(),
});

export const FocusSessionSchema = z.object({
  id: z.string(),
  kind: SessionKindSchema,
  status: SessionStatusSchema,
  startedAt: EpochMsSchema,
  plannedEndAt: EpochMsSchema,
  endedAt: EpochMsSchema.nullable(),
  pauses: z.array(SessionPauseSchema),
});

export const StartSessionRequestSchema = z.object({
  kind: SessionKindSchema,
  durationMs: z.number().int().min(MIN_SESSION_DURATION_MS).max(MAX_SESSION_DURATION_MS),
});

export const SessionRangeQuerySchema = z
  .object({
    from: z.coerce.number().int().positive(),
    to: z.coerce.number().int().positive(),
  })
  .refine((range) => range.to > range.from, { message: "to must be after from", path: ["to"] })
  .refine((range) => range.to - range.from <= MAX_SESSION_RANGE_MS, {
    message: "The range can be at most 31 days",
    path: ["to"],
  });

export const SessionIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const CurrentSessionResponseSchema = z.object({
  session: FocusSessionSchema.nullable(),
});

export const SessionListResponseSchema = z.object({
  sessions: z.array(FocusSessionSchema),
});

export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export type SessionKind = z.infer<typeof SessionKindSchema>;

export type SessionRangeQuery = z.infer<typeof SessionRangeQuerySchema>;

export type SessionPause = z.infer<typeof SessionPauseSchema>;

export type FocusSession = z.infer<typeof FocusSessionSchema>;

export type StartSessionRequest = z.infer<typeof StartSessionRequestSchema>;

export type SessionIdParams = z.infer<typeof SessionIdParamsSchema>;

export type CurrentSessionResponse = z.infer<typeof CurrentSessionResponseSchema>;

export type SessionListResponse = z.infer<typeof SessionListResponseSchema>;

export const WindowSampleSchema = z.object({
  title: z.string().min(1).max(1024),
  name: z.string().min(1).max(256),
});

export const SampleBatchSchema = z.array(WindowSampleSchema).max(50);

export type WindowSample = z.infer<typeof WindowSampleSchema>;

export type SampleBatch = z.infer<typeof SampleBatchSchema>;
