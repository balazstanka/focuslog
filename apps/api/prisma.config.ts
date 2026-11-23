import "dotenv/config";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "prisma/config";
import { DatabaseEnvSchema } from "./src/config/database-env";

const { DATABASE_PROVIDER, DATABASE_URL } = DatabaseEnvSchema.parse(process.env);

// Prisma rejects env() in datasource.provider, so the datasource block is
// generated here, before any Prisma CLI command reads the schema folder.
writeFileSync(
  path.join("prisma", "schema", "datasource.prisma"),
  `datasource db {\n  provider = "${DATABASE_PROVIDER}"\n}\n`,
);

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: path.join("prisma", "migrations", DATABASE_PROVIDER),
  },
  datasource: {
    url: DATABASE_URL,
  },
});
