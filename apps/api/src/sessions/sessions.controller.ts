import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { createZodDto, ZodResponse } from "nestjs-zod";
import {
  CurrentSessionResponseSchema,
  FocusSessionSchema,
  SessionIdParamsSchema,
  SessionListResponseSchema,
  SessionRangeQuerySchema,
  StartSessionRequestSchema,
} from "@focuslog/shared";
import { SessionsService } from "./sessions.service";

class FocusSessionDto extends createZodDto(FocusSessionSchema) {}
class StartSessionRequestDto extends createZodDto(StartSessionRequestSchema) {}
class SessionIdParamsDto extends createZodDto(SessionIdParamsSchema) {}
class SessionRangeQueryDto extends createZodDto(SessionRangeQuerySchema) {}
class CurrentSessionResponseDto extends createZodDto(CurrentSessionResponseSchema) {}
class SessionListResponseDto extends createZodDto(SessionListResponseSchema) {}

@ApiTags("sessions")
@ApiCookieAuth()
@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get("current")
  @ZodResponse({ status: 200, type: CurrentSessionResponseDto })
  getCurrentSession(@Session() userSession: UserSession) {
    return this.sessionsService.findCurrent(userSession.user.id);
  }

  @Get()
  @ZodResponse({ status: 200, type: SessionListResponseDto })
  listSessions(@Session() userSession: UserSession, @Query() query: SessionRangeQueryDto) {
    return this.sessionsService.listInRange(userSession.user.id, query);
  }

  @Post()
  @ZodResponse({ status: 201, type: FocusSessionDto })
  startSession(@Session() userSession: UserSession, @Body() body: StartSessionRequestDto) {
    return this.sessionsService.start(userSession.user.id, body.kind, body.durationMs);
  }

  @Post(":id/pause")
  @ZodResponse({ status: 200, type: FocusSessionDto })
  pauseSession(@Session() userSession: UserSession, @Param() params: SessionIdParamsDto) {
    return this.sessionsService.pause(userSession.user.id, params.id);
  }

  @Post(":id/resume")
  @ZodResponse({ status: 200, type: FocusSessionDto })
  resumeSession(@Session() userSession: UserSession, @Param() params: SessionIdParamsDto) {
    return this.sessionsService.resume(userSession.user.id, params.id);
  }

  @Post(":id/stop")
  @ZodResponse({ status: 200, type: FocusSessionDto })
  stopSession(@Session() userSession: UserSession, @Param() params: SessionIdParamsDto) {
    return this.sessionsService.stop(userSession.user.id, params.id);
  }
}
