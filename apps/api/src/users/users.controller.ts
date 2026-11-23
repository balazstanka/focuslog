import { Controller, Get } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { createZodDto, ZodResponse } from "nestjs-zod";
import { CurrentUserSchema } from "@focuslog/shared";
import { UsersService } from "./users.service";

class CurrentUserDto extends createZodDto(CurrentUserSchema) {}

@ApiTags("users")
@ApiCookieAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @ZodResponse({ type: CurrentUserDto })
  getCurrentUser(@Session() session: UserSession) {
    return this.usersService.findCurrentUser(session.user.id);
  }
}
