import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  SessionKindSchema,
  SessionStatusSchema,
  type CurrentSessionResponse,
  type FocusSession,
  type SessionKind,
  type SessionListResponse,
  type SessionRangeQuery,
  type SessionStatus,
} from "@focuslog/shared";
import { Prisma, PrismaClient } from "../generated/prisma/client";

const ACTIVE_STATUSES: SessionStatus[] = ["running", "paused"];

const withPauses = {
  pauses: { orderBy: { startedAt: "asc" } },
} satisfies Prisma.FocusSessionInclude;

type SessionRow = Prisma.FocusSessionGetPayload<{ include: typeof withPauses }>;

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaClient) {}

  findCurrent(userId: string): Promise<CurrentSessionResponse> {
    return this.prisma.$transaction(async (tx) => {
      const session = await findActiveSession(tx, userId, Date.now());
      return { session: session ? toFocusSession(session) : null };
    });
  }

  listInRange(userId: string, { from, to }: SessionRangeQuery): Promise<SessionListResponse> {
    return this.prisma.$transaction(async (tx) => {
      await findActiveSession(tx, userId, Date.now());
      const sessions = await tx.focusSession.findMany({
        where: {
          userId,
          startedAt: { lt: BigInt(to) },
          OR: [{ endedAt: { gt: BigInt(from) } }, { endedAt: null }],
        },
        include: withPauses,
        orderBy: { startedAt: "asc" },
      });
      return { sessions: sessions.map(toFocusSession) };
    });
  }

  async start(userId: string, kind: SessionKind, durationMs: number): Promise<FocusSession> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const now = Date.now();
        if (await findActiveSession(tx, userId, now)) {
          throw activeSessionConflict();
        }
        const session = await tx.focusSession.create({
          data: {
            userId,
            activeUserId: userId,
            kind,
            status: "running" satisfies SessionStatus,
            startedAt: BigInt(now),
            plannedEndAt: BigInt(now + durationMs),
          },
          include: withPauses,
        });
        return toFocusSession(session);
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw activeSessionConflict();
      }
      throw error;
    }
  }

  pause(userId: string, sessionId: string): Promise<FocusSession> {
    return this.prisma.$transaction(async (tx) => {
      const now = BigInt(Date.now());
      await findOwnedSession(tx, userId, sessionId, now);
      await transitionStatus(tx, sessionId, ["running"], { status: "paused" });
      await tx.sessionPause.create({ data: { sessionId, startedAt: now } });
      return toFocusSession(await loadSession(tx, sessionId));
    });
  }

  resume(userId: string, sessionId: string): Promise<FocusSession> {
    return this.prisma.$transaction(async (tx) => {
      const now = BigInt(Date.now());
      const session = await findOwnedSession(tx, userId, sessionId, now);
      const openPause = findOpenPause(session);
      if (!openPause) {
        throw new ConflictException("Session is not paused");
      }
      await transitionStatus(tx, sessionId, ["paused"], {
        status: "running",
        plannedEndAt: session.plannedEndAt + (now - openPause.startedAt),
      });
      await tx.sessionPause.update({ where: { id: openPause.id }, data: { endedAt: now } });
      return toFocusSession(await loadSession(tx, sessionId));
    });
  }

  stop(userId: string, sessionId: string): Promise<FocusSession> {
    return this.prisma.$transaction(async (tx) => {
      const now = BigInt(Date.now());
      await findOwnedSession(tx, userId, sessionId, now);
      await transitionStatus(tx, sessionId, ACTIVE_STATUSES, {
        status: "cancelled",
        endedAt: now,
        activeUserId: null,
      });
      await tx.sessionPause.updateMany({
        where: { sessionId, endedAt: null },
        data: { endedAt: now },
      });
      return toFocusSession(await loadSession(tx, sessionId));
    });
  }
}

async function findActiveSession(tx: Prisma.TransactionClient, userId: string, now: number) {
  const session = await tx.focusSession.findUnique({
    where: { activeUserId: userId },
    include: withPauses,
  });
  if (!session) {
    return null;
  }
  const current = await finishIfExpired(tx, session, BigInt(now));
  return current.activeUserId ? current : null;
}

async function findOwnedSession(
  tx: Prisma.TransactionClient,
  userId: string,
  sessionId: string,
  now: bigint,
) {
  const session = await tx.focusSession.findFirst({
    where: { id: sessionId, userId },
    include: withPauses,
  });
  if (!session) {
    throw new NotFoundException("Session not found");
  }
  return finishIfExpired(tx, session, now);
}

async function finishIfExpired(
  tx: Prisma.TransactionClient,
  session: SessionRow,
  now: bigint,
): Promise<SessionRow> {
  if (session.status !== "running" || now < session.plannedEndAt) {
    return session;
  }
  return tx.focusSession.update({
    where: { id: session.id },
    data: {
      status: "finished" satisfies SessionStatus,
      endedAt: session.plannedEndAt,
      activeUserId: null,
    },
    include: withPauses,
  });
}

async function transitionStatus(
  tx: Prisma.TransactionClient,
  sessionId: string,
  from: SessionStatus[],
  data: Prisma.FocusSessionUpdateManyMutationInput & { status: SessionStatus },
) {
  const { count } = await tx.focusSession.updateMany({
    where: { id: sessionId, status: { in: from } },
    data,
  });
  if (count === 0) {
    throw new ConflictException(`Session is not ${from.join(" or ")}`);
  }
}

function loadSession(tx: Prisma.TransactionClient, sessionId: string) {
  return tx.focusSession.findUniqueOrThrow({ where: { id: sessionId }, include: withPauses });
}

function findOpenPause(session: SessionRow) {
  return session.pauses.find((pause) => pause.endedAt === null);
}

function toFocusSession(session: SessionRow): FocusSession {
  return {
    id: session.id,
    kind: SessionKindSchema.parse(session.kind),
    status: SessionStatusSchema.parse(session.status),
    startedAt: Number(session.startedAt),
    plannedEndAt: Number(session.plannedEndAt),
    endedAt: toNullableNumber(session.endedAt),
    pauses: session.pauses.map((pause) => ({
      startedAt: Number(pause.startedAt),
      endedAt: toNullableNumber(pause.endedAt),
    })),
  };
}

function toNullableNumber(value: bigint | null) {
  return value === null ? null : Number(value);
}

function activeSessionConflict() {
  return new ConflictException("Another session is already running or paused");
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
