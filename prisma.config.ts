import "dotenv/config";
import { defineConfig } from "prisma/config";

// We provide a dummy URL for the build process, 
// as the real DATABASE_URL is not available at this stage.
const databaseUrl =
  process.env.DATABASE_URL || "postgresql://dummy:dummy@dummy:5432/dummy";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});
