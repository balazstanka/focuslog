import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";
import { env } from "../config/env";
import { prisma } from "../prisma/prisma-client";

export const auth = betterAuth({
  basePath: "/api/auth",
  database: prismaAdapter(prisma, { provider: env.DATABASE_PROVIDER }),
  emailAndPassword: { enabled: true },
  plugins: [openAPI()],
  trustedOrigins: [env.WEB_ORIGIN],
});
