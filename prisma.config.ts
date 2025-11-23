import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Use DATABASE_URL_MIGRATE if set (for migrations), otherwise DATABASE_URL
    url: process.env.DATABASE_URL_MIGRATE || env("DATABASE_URL"),
  },
  // Increase timeout for migrations (in case pooler is slow)
  migrate: {
    timeout: 30000, // 30 seconds instead of default 10
  },
});
