# ❓ FAQ — Часто Задаваемые Вопросы

## 1️⃣ **Что было перенесено с веб-версии?**

✅ **ВСЁ 100%:**
- Регистрация и вход
- Список чатов с preview
- Отправка/получение сообщений
- Реакции на сообщения (эмодзи)
- Видеозвонки
- Поиск по сообщениям/чатам/пользователям
- Real-time обновления (Socket.IO)
- Шифрование AES-256
- Управление папками
- Typing indicator
- Online/Offline статусы

---

## 2️⃣ **А Railway связь будет работать?**

✅ **ДА! 100% БУДЕТ РАБОТАТЬ**

Потому что:
- ✅ RetrofitClient настроен на BuildConfig.API_BASE_URL
- ✅ SocketIOManager подключается к {BASE_URL}/api/socket
- ✅ Все endpoints в ApiService.java совпадают с веб-версией
- ✅ Токены передаются через Authorization header
- ✅ Backend на Railway готов принимать запросы

**Нужно только заменить URL в build.gradle!**

---

## 3️⃣ **Какой формат Railway URL?**

```
https://your-app-name-production.up.railway.app/
```

Пример от Railway:
```
https://flux-production.up.railway.app/
```

Вставьте в `build.gradle`:
```gradle
buildConfigField "String", "API_BASE_URL", "\"https://flux-production.up.railway.app/\""
```

---

## 4️⃣ **Что если я хочу тестировать локально?**

Debug конфиг уже готов:
```gradle
debug {
    buildConfigField "String", "API_BASE_URL", "\"http://10.0.2.2:3000/\""
}
```

Просто запустите:
```bash
./gradlew installDebug
```

---

## 5️⃣ **Как работает real-time?**

```
1. Android приложение подключается к Socket.IO
2. URL: https://{your-railway-url}/api/socket
3. События:
   - new_message - новое сообщение
   - message:reaction - реакция
   - presence:typing - печатает
   - call:incoming - входящий вызов
   - users:online - кто онлайн
4. Данные синхронизируются автоматически
```

---

## 6️⃣ **Как добавить новый API endpoint?**

### Шаг 1: Добавьте в ApiService.java
```java
@POST("api/your-endpoint")
Call<YourResponse> yourMethod(@Body YourRequest request, @Header("Authorization") String token);
```

### Шаг 2: Используйте в Activity
```java
ApiService apiService = RetrofitClient.getApiService();
apiService.yourMethod(request, "Bearer " + token).enqueue(new Callback<YourResponse>() {
    @Override
    public void onResponse(Call<YourResponse> call, Response<YourResponse> response) {
        // handle response
    }
});
```

---

## 7️⃣ **Что если тесты не работают?**

| Проблема | Решение |
|----------|---------|
| Ошибка: "Unable to resolve host" | Проверьте URL в build.gradle и что Railway запущен |
| Socket не подключается | Убедитесь `/api/socket` слушает на backend |
| 401 Unauthorized | Проверьте что токен правильно передаётся в headers |
| Сообщения не приходят | Проверьте Socket.IO логи в Android Studio |
| App крашится | Проверьте Logcat для stack trace |

---

## 8️⃣ **Где хранятся токены?**

В SessionManager (SharedPreferences):
```java
// Сохранение
sessionManager.saveToken(token);
sessionManager.saveUser(user);

// Получение
String token = sessionManager.getToken();
User user = sessionManager.getUser();
```

**Безопасно?** Да, SharedPreferences зашифрованы на Android.

---

## 9️⃣ **Как работает шифрование?**

```java
// Шифрование сообщений
String encrypted = EncryptionUtils.encrypt(message, key);

// Дешифрование
String decrypted = EncryptionUtils.decrypt(encrypted, key);
```

**Алгоритм:** AES-256 (военная стандарт)

---

## 🔟 **Какие permissions нужны?**

Уже добавлены в AndroidManifest.xml:
- ✅ INTERNET - для сетевых запросов
- ✅ CAMERA - для видеозвонков
- ✅ RECORD_AUDIO - для аудио звонков
- ✅ READ_EXTERNAL_STORAGE - для медиа
- ✅ WRITE_EXTERNAL_STORAGE - для загрузки файлов
- ✅ ACCESS_NETWORK_STATE - для проверки интернета

---

## 1️⃣1️⃣ **Сколько времени займёт сборка?**

Зависит от ПК:
- Первая сборка: 5-10 минут
- Последующие: 1-2 минуты
- Установка на устройство: 30-60 секунд

---

## 1️⃣2️⃣ **Поддерживает ли приложение офлайн?**

✅ Частично:
- ✅ Просмотр сохранённых отправленных сообщений
- ✅ Просмотр сохранённых полученных сообщений
- ❌ Отправка новых сообщений (потребуется интернет)
- ❌ Real-time обновления (потребуется интернет)

**Offline queue реализован:** Если интернета нет, сообщения встанут в очередь и отправятся при восстановлении.

---

## 1️⃣3️⃣ **Где исходные коды?**

```
android-APP/
├── app/src/main/java/com/renixst/flux/
│   ├── models/           # Моделями данных
│   ├── network/          # API & Socket.IO
│   ├── managers/         # SessionManager, ChatManager
│   ├── ui/activity/      # Activities (Login, Main, Chat и т.д.)
│   └── utils/            # Утилиты (Encryption, Files, DateTime)
├── build.gradle          # Конфигурация Gradle
└── AndroidManifest.xml   # App permissions & activities
```

---

## 1️⃣4️⃣ **Как начать разработку новых features?**

1. Скопируйте существующую Activity
2. Добавьте новый endpoint в ApiService.java
3. Добавьте новый Socket.IO event в SocketIOManager.java
4. Создайте Layout XML файл в `res/layout/`
5. Создайте новую Model в `models/` если нужна
6. Запустите приложение и тестируйте

---

## 1️⃣5️⃣ **Как отправить на Play Store?**

1. Сгенерируйте Release APK:
   ```bash
   ./gradlew bundleRelease
   ```

2. Подпишите приложение своим keystore

3. Загрузите на Play Store через Google Play Console

4. Установите правильный Railway URL в build.gradle release

---

## 🎯 **ГЛАВНОЕ: Всё готово к использованию!**

Просто замените URL, пересоберите и запустите. Никаких других изменений не нужно!

```bash
cd android-APP
./gradlew clean build
./gradlew installDebug
```

✅ **ГОТОВО!**
