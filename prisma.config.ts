import { defineConfig, env } from "prisma/config";

// Check if the command is 'prisma generate'
const isGenerate = process.argv.includes("generate");

let databaseUrl;

if (isGenerate) {
  // For 'prisma generate' during build, we don't need a real database.
  // A dummy URL is provided to prevent the build from failing.
  databaseUrl = "postgresql://dummy:dummy@dummy:5432/dummy";
} else {
  // For all other commands (like 'db push') and at runtime,
  // we require the real DATABASE_URL.
  // The env() helper will throw a clear error if it's not set.
  databaseUrl = env("DATABASE_URL");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});
