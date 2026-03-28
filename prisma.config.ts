import { defineConfig } from "prisma/config";

const getDatabaseUrl = () => {
  // Во время сборки (`prisma generate`) реальная база данных не нужна.
  // Используем фиктивный URL, чтобы сборка не падала.
  if (process.argv.includes("generate")) {
    return "postgresql://dummy:dummy@dummy:5432/dummy";
  }

  // Для всех остальных команд (`db push`, запуск) нам нужен настоящий DATABASE_URL.
  // Мы берем его напрямую из переменных окружения.
  const url = process.env.DATABASE_URL;

  // Если переменная не установлена, выбрасываем громкую и понятную ошибку.
  if (!url) {
    throw new Error("Переменная окружения DATABASE_URL не установлена!");
  }

  return url;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: getDatabaseUrl(),
  },
});
