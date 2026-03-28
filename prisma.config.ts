import { defineConfig } from "prisma/config";

// Определяем, является ли команда командой для работы с базой данных.
// Это команды, которым нужен настоящий URL к базе данных.
const isDbCommand = process.argv.some(arg => ["db", "migrate", "studio"].includes(arg));

let url;

if (isDbCommand) {
  // Для команд, работающих с БД, URL обязателен.
  url = process.env.DATABASE_URL;

  // Если URL не установлен или пуст, выбрасываем громкую ошибку.
  // Если ты увидишь эту ошибку в логах, значит, переменная DATABASE_URL
  // не доходит до твоего приложения в облаке.
  if (!url || url.trim() === "") {
    throw new Error("КРИТИЧЕСКАЯ ОШИБКА: DATABASE_URL не установлена для команды, работающей с БД.");
  }
} else {
  // Для всех остальных команд (например, `prisma generate` во время сборки)
  // используем фиктивный URL, чтобы сборка не падала.
  url = "postgresql://dummy:dummy@dummy:5432/dummy";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: url,
  },
});
