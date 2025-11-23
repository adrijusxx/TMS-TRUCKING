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
});
