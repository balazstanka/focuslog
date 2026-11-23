import { Global, Module, type OnApplicationShutdown } from "@nestjs/common";
import { PrismaClient } from "../generated/prisma/client";
import { prisma } from "./prisma-client";

// better-auth is configured at import time and needs the client before Nest
// starts, so services get that same instance instead of a second connection.
@Global()
@Module({
  providers: [{ provide: PrismaClient, useValue: prisma }],
  exports: [PrismaClient],
})
export class PrismaModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await prisma.$disconnect();
  }
}
