import "dotenv/config";
import { defineConfig } from 'prisma/defineConfig';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});