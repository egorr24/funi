const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const next = require('next');
const multer = require('multer');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Настройка Cloudinary для постоянного хранения
console.log('> Checking Cloudinary configuration...');
const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });
  console.log('> Cloudinary configured successfully (keys trimmed).');
} else {
  console.warn('> WARNING: Cloudinary credentials missing or incomplete.');
}

// Настройка Multer для хранения файлов на Railway (в папке uploads)
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`[INIT] Created upload directory: ${uploadDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Гарантируем, что папка существует перед записью
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const PORT = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const { initDatabase } = require('./models/database');

const app = express();
const server = http.createServer(app);

// 1. МГНОВЕННЫЙ ОТВЕТ ДЛЯ RAILWAY (ЧТОБЫ БЫЛ ONLINE)
app.use((req, res, next) => {
  if (req.url === '/health' || req.url === '/_health') {
    return res.status(200).send('OK');
  }
  next();
});

// 2. SOCKET.IO SETUP
const io = socketIo(server, {
  path: '/api/socket',
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ['polling', 'websocket'],
  allowEIO3: true
});
app.set('io', io);

const onlineUsers = new Map();

// Периодическая проверка (каждые 30 сек выводим кто в сети)
setInterval(() => {
  if (onlineUsers.size > 0) {
    console.log(`[STATUS] Online users: ${Array.from(onlineUsers.keys()).join(', ')}`);
  }
}, 30000);

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  
  const registerUser = (uid) => {
    if (!uid) return;
    socket.join(uid);
    if (!onlineUsers.has(uid)) {
      onlineUsers.set(uid, new Set());
    }
    onlineUsers.get(uid).add(socket.id);
    console.log(`[CONN] User ${uid} registered (Socket: ${socket.id}). Total: ${onlineUsers.size}`);
  };

  if (userId && userId !== 'u_me') {
    registerUser(userId);
  }

  // Принудительная регистрация/обновление статуса
  socket.on('user:online', ({ userId: uid }) => {
    if (uid && uid !== 'u_me') {
      registerUser(uid);
    }
  });

  socket.on('heartbeat', () => {
    if (userId && userId !== 'u_me') {
      registerUser(userId);
    }
    socket.emit('heartbeat:ack');
  });

  // Обработка сообщений в реальном времени
  socket.on('message:queue', async (message) => {
    socket.to(message.chatId).emit('new_message', message);
  });

  // Вход в комнату чата
  socket.on('chat:join', ({ chatId }) => {
    socket.join(chatId);
  });

  // ГЛОБАЛЬНЫЙ СИГНАЛИНГ ДЛЯ ЗВОНКОВ (ЧЕРЕЗ КОМНАТУ И ПЕРСОНАЛЬНО)
  socket.on('call:offer', ({ chatId, targetId, fromName, offer, mode }) => {
    console.log(`[CALL] Offer from ${userId} to ${targetId} (Chat: ${chatId})`);
    
    // 1. Отправляем в комнату чата (если кто-то там есть)
    socket.to(chatId).emit('call:offer', { from: userId, fromName, offer, mode, chatId });
    
    // 2. Отправляем персонально пользователю (чтобы звонок прошел, даже если другой чат открыт)
    if (targetId && targetId !== userId) {
      io.to(targetId).emit('call:offer', { from: userId, fromName, offer, mode, chatId });
    }
  });

  socket.on('call:answer', ({ targetId, answer, chatId }) => {
    console.log(`[CALL] Answer from ${userId} to ${targetId}`);
    io.to(targetId).emit('call:answer', { from: userId, answer, chatId });
  });

  socket.on('call:ice', ({ targetId, candidate, chatId }) => {
    io.to(targetId).emit('call:ice', { from: userId, candidate, chatId });
  });

  socket.on('call:end', ({ targetId, chatId }) => {
    console.log(`[CALL] End from ${userId} to ${targetId}`);
    if (targetId) {
      io.to(targetId).emit('call:end', { from: userId, chatId });
    }
    if (chatId) {
      socket.to(chatId).emit('call:end', { from: userId, chatId });
    }
  });

  socket.on('call:busy', ({ targetId }) => {
    console.log(`[CALL] Busy from ${userId} to ${targetId}`);
    io.to(targetId).emit('call:busy', { from: userId });
  });

  socket.on('chat:new', ({ targetId, chat }) => {
    io.to(targetId).emit('chat:new', chat);
  });

  socket.on('disconnect', () => {
    if (userId && onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socket.id);
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
      }
      console.log(`[CONN] User ${userId} disconnected. Online: ${onlineUsers.size} users`);
    }
  });
});

// 3. MIDDLEWARE
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// API для загрузки медиа
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    console.error('[UPLOAD] No file in request');
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    // Читаем переменные ПРЯМО ТУТ, чтобы быть уверенными
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

    console.log(`[UPLOAD] Processing file: ${req.file.filename}`);
    console.log(`[UPLOAD] Cloudinary config check: Name=${!!cloudName}, Key=${!!apiKey}, Secret=${!!apiSecret}`);

    // Если Cloudinary настроен, загружаем туда для постоянного хранения
    if (cloudName && apiKey && apiSecret) {
      console.log(`[UPLOAD] Cloudinary credentials found. Uploading...`);
      
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'flux_uploads',
        resource_type: 'auto'
      });

      console.log(`[UPLOAD] Cloudinary success: ${result.secure_url}`);

      // Удаляем временный файл после загрузки в облако
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.warn(`[UPLOAD] Temp file delete failed: ${e.message}`);
      }

      return res.json({ 
        url: result.secure_url, 
        type: req.file.mimetype.startsWith('image/') ? 'image' : 
              req.file.mimetype.startsWith('video/') ? 'video' : 
              req.file.mimetype.startsWith('audio/') ? 'audio' : 'file'
      });
    }

    // Иначе сохраняем локально (в папку public/uploads)
    console.warn(`[UPLOAD] NO Cloudinary credentials! Saving to public/uploads (TEMPORARY).`);
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.get('host');
    const url = `${protocol}://${host}/uploads/${req.file.filename}`;
    
    console.log(`[UPLOAD] Local URL generated: ${url}`);
    
    res.json({ 
      url, 
      type: req.file.mimetype.startsWith('image/') ? 'image' : 
            req.file.mimetype.startsWith('video/') ? 'video' : 
            req.file.mimetype.startsWith('audio/') ? 'audio' : 'file'
    });
  } catch (err) {
    console.error('[UPLOAD] CRITICAL ERROR:', err);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// 4. NEXT.JS ПРЕПАРАЦИЯ (В ФОНЕ)
let nextReady = false;
nextApp.prepare().then(() => {
  nextReady = true;
  console.log('> Next.js READY');
}).catch(err => {
  console.error('> Next.js Prepare Error:', err);
});

// 5. ОБРАБОТКА ВСЕХ ЗАПРОСОВ
app.all('*', (req, res) => {
  if (!nextReady) {
    // Railway увидит 200 и не будет паниковать
    return res.status(200).send('Server is warming up... please refresh in 30 seconds.');
  }
  return handle(req, res);
});

// 6. START SERVER IMMEDIATELY
server.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('> Server failed to start:', err);
    process.exit(1);
  }
  console.log(`> App is ONLINE on port ${PORT}`);
  
  // Clean up DATABASE_URL from potential whitespaces
  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.trim();
    const masked = process.env.DATABASE_URL.replace(/\/\/.*@/, '//****@');
    console.log(`> DB URL cleaned and ready: ${masked}`);
  }
  
  initDatabase().catch(err => console.error('> Database Init Error:', err));
});
