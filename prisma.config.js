const { defineConfig } = require("prisma/config");

// Определяем, является ли команда командой для работы с базой данных.
const isDbCommand = process.argv.some(arg => ["db", "migrate", "studio"].includes(arg));

let url;

if (isDbCommand) {
  // Для команд, работающих с БД, URL обязателен.
  url = process.env.DATABASE_URL;

  // Если URL не установлен или пуст, выбрасываем ошибку.
  if (!url || url.trim() === "") {
    throw new Error("КРИТИЧЕСКАЯ ОШИБКА: DATABASE_URL не установлена для команды, работающей с БД.");
  }
} else {
  // Для всех остальных команд (например, `prisma generate` во время сборки)
  // используем фиктивный URL.
  url = "postgresql://dummy:dummy@dummy:5432/dummy";
}

// Экспортируем конфигурацию в формате CommonJS.
module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: url,
  },
});
