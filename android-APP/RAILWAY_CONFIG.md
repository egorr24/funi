# Railway Configuration для Android приложения

## 🚀 Для подключения к Railway

### Шаг 1: Получите Railway URL
1. Перейдите в Railway Dashboard: https://railway.app
2. Откройте ваше приложение "flux"
3. Скопируйте URL из раздела "Deployments" (вида: `https://flux-production.up.railway.app/`)

### Шаг 2: Обновите build.gradle
В файле `android-APP/app/build.gradle` замените:

```gradle
buildTypes {
    release {
        buildConfigField "String", "API_BASE_URL", "\"https://YOUR_RAILWAY_URL/\""
    }
}
```

Замените `YOUR_RAILWAY_URL` на ваш реальный URL от Railway.

### Шаг 3: Пересоберите приложение

```bash
cd android-APP
./gradlew clean build
```

### Шаг 4: Установите на устройство

```bash
./gradlew installDebug  # На эмулятор/устройство
```

---

## 📱 API Endpoints (уже настроены в ApiService.java)

Все endpoints автоматически будут использовать BASE_URL из BuildConfig:

- `POST /api/register` - Регистрация
- `POST /api/login` - Вход
- `GET /api/chats` - Список чатов
- `POST /api/messages` - Отправка сообщений
- `POST /api/calls` - Инициирование вызовов
- `GET /api/socket` - Socket.IO конфигурация

---

## 🔗 Socket.IO подключение

Socket.IO автоматически подключится к:
- **URL**: `{BASE_URL}/api/socket`
- **Path**: `/api/socket`
- **Auth**: Через token в headers

---

## ✅ Проверка подключения

После сборки приложение:
1. Откроет Login экран
2. Регистрируется через Railway backend
3. Подключится к Socket.IO для real-time событий

---

## 🐛 Troubleshooting

### Ошибка: "Unable to resolve host"
- Проверьте что Railway приложение запущено
- Проверьте правильность URL в build.gradle

### Ошибка: "Socket connection failed"
- Убедитесь что Socket.IO слушает на `/api/socket`
- Проверьте CORS конфигурацию на backend

### Ошибка: "401 Unauthorized"
- Убедитесь что токен правильно передаётся в headers
- Проверьте JWT secret на backend

---

## 📊 Проверка состояния

Логи будут выводиться в Android Studio Logcat:
```
I/SocketIO: Socket connected successfully
I/ApiService: Login successful
I/MainActivity: Chats loaded
```
