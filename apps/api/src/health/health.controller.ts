import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { createZodDto, ZodResponse } from "nestjs-zod";
import { HealthResponseSchema, PROTOCOL_VERSION } from "@focuslog/shared";

class HealthResponseDto extends createZodDto(HealthResponseSchema) {}

@ApiTags("health")
@AllowAnonymous()
@Controller("health")
export class HealthController {
  @Get()
  @ZodResponse({ type: HealthResponseDto })
  getHealth() {
    return { ok: true, protocol: PROTOCOL_VERSION };
  }
}
