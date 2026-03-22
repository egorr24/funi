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
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('> Cloudinary configured successfully.');
} else {
  console.warn('> WARNING: Cloudinary credentials missing. Media will not persist after redeploy!');
}

// Настройка Multer для хранения файлов на Railway (в папке uploads)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`> Created upload directory: ${uploadDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
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

  // УЛУЧШЕННЫЙ СИГНАЛИНГ ДЛЯ ЗВОНКОВ
  socket.on('call:offer', ({ targetId, fromName, offer, mode }) => {
    console.log(`[CALL] Offer from ${userId} (${fromName}) to ${targetId}`);
    
    if (userId === targetId) {
      console.warn(`[CALL] User ${userId} is trying to call themselves.`);
      socket.emit('call:failed', { targetId, reason: 'self-call' });
      return;
    }

    // Проверяем через карту онлайн-пользователей
    const isTargetOnline = onlineUsers.has(targetId) && onlineUsers.get(targetId).size > 0;
    
    if (isTargetOnline) {
      console.log(`[CALL] Target ${targetId} is online, sending offer...`);
      io.to(targetId).emit('call:offer', { from: userId, fromName, offer, mode });
    } else {
      console.warn(`[CALL] Target ${targetId} is OFFLINE. Active users: ${Array.from(onlineUsers.keys()).join(', ')}`);
      socket.emit('call:failed', { targetId, reason: 'offline' });
    }
  });

  socket.on('call:answer', ({ targetId, answer }) => {
    console.log(`[CALL] Answer from ${userId} to ${targetId}`);
    io.to(targetId).emit('call:answer', { from: userId, answer });
  });

  socket.on('call:ice', ({ targetId, candidate }) => {
    io.to(targetId).emit('call:ice', { from: userId, candidate });
  });

  socket.on('call:end', ({ targetId }) => {
    console.log(`[CALL] End from ${userId} to ${targetId}`);
    io.to(targetId).emit('call:end', { from: userId });
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API для загрузки медиа
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  try {
    // Возвращаемся к локальному хранилищу по просьбе пользователя
    console.log(`> Saving file locally: ${req.file.filename}`);
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const url = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.json({ 
      url, 
      type: req.file.mimetype.startsWith('image/') ? 'image' : 
            req.file.mimetype.startsWith('video/') ? 'video' : 
            req.file.mimetype.startsWith('audio/') ? 'audio' : 'file'
    });
  } catch (err) {
    console.error('Upload error details:', err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
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
