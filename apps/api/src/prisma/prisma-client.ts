import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "../config/env";

function createDatabaseAdapter() {
  if (env.DATABASE_PROVIDER === "postgresql") {
    return new PrismaPg({ connectionString: env.DATABASE_URL });
  }
  return new PrismaBetterSqlite3({ url: env.DATABASE_URL });
}

export const prisma = new PrismaClient({ adapter: createDatabaseAdapter() });
