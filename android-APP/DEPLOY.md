# Flux Android App - Инструкции по развёртыванию

## Требования

- Java 8+
- Android SDK 34+
- Gradle 8.0+
- Android Studio 2024+

## Шаги установки

### 1. Подготовка окружения

```bash
# Установите Android SDK
export ANDROID_HOME=~/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 2. Клонирование и синхронизация

```bash
cd android-APP
./gradlew clean
./gradlew sync
```

### 3. Конфигурация

Отредактируйте файл `app/src/main/java/com/renixst/flux/network/RetrofitClient.java`:

```java
private static final String BASE_URL = "https://your-railway-url:3000/";
```

### 4. Сборка

```bash
# Debug сборка
./gradlew assembleDebug

# Release сборка
./gradlew assembleRelease
```

### 5. Установка на устройство

```bash
# Запуск на эмуляторе
./gradlew installDebug

# Запуск на реальном устройстве
adb install build/outputs/apk/debug/app-debug.apk
```

## Railway развёртывание

### Используемые переменные:

- `DB_URL` - URL базы данных PostgreSQL
- `JWT_SECRET` - Секретный ключ для JWT токенов
- `NODEENV` - Установите на `production`

## Тестирование

### Unit тесты

```bash
./gradlew test
```

### Instrumented тесты

```bash
./gradlew connectedAndroidTest
```

## Продакшн готовность

- ✅ Все необходимые permissions добавлены
- ✅ API интеграция готова
- ✅ Socket.IO поддержка
- ✅ Шифрование сообщений
- ✅ Error handling
- ✅ Offline поддержка (базовая)
- ⚠️ WebRTC для видеозвонков (требует дополнительной настройки)
- ⚠️ Push уведомления (требует Firebase)

## Известные ограничения

- Видеозвонки требуют WebRTC библиотеку
- Offline сообщения требуют локального хранилища (SQLite)
- Медиа файлы требуют Cloudinary или подобного сервиса

## Финальные шаги

1. Обновите backend URL в RetrofitClient
2. Протестируйте все основные функции
3. Проверьте логи и обработку ошибок
4. Подготовьте версию для publishing на Google Play
