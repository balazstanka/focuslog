import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaClient } from "../generated/prisma/client";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaClient) {}

  async findCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }
}
