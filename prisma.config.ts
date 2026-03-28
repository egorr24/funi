import { defineConfig } from "prisma/config";

const getDatabaseUrl = () => {
  // Во время сборки (`prisma generate`) реальная база данных не нужна.
  if (process.argv.includes("generate")) {
    return "postgresql://dummy:dummy@dummy:5432/dummy";
  }

  const url = process.env.DATABASE_URL;

  // Важно проверить, что URL не просто есть, а что он не пустой.
  // Некоторые облачные среды могут установить пустую строку, что приведет к ошибке.
  if (!url || url.trim() === "") {
    throw new Error("DATABASE_URL не установлена или является пустой строкой.");
  }

  return url;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: getDatabaseUrl(),
  },
});
