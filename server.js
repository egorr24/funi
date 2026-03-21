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
  transports: ['polling', 'websocket'], // Соответствует клиенту
  allowEIO3: true // Для обратной совместимости если нужно
});
app.set('io', io);

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  if (userId) {
    socket.join(userId);
    console.log(`> User connected: ${userId} (Socket ID: ${socket.id})`);
  }

  // Обработка сообщений в реальном времени
  socket.on('message:queue', async (message) => {
    console.log(`> Message from ${message.senderId} in chat ${message.chatId}`);
    // Рассылаем всем в комнате чата (нужно чтобы клиенты джойнились в chatId)
    socket.to(message.chatId).emit('new_message', message);
  });

  // Вход в комнату чата
  socket.on('chat:join', ({ chatId }) => {
    socket.join(chatId);
    console.log(`> Socket ${socket.id} joined chat room: ${chatId}`);
  });

  // Сигналинг для звонков
  socket.on('call:offer', ({ targetId, offer, mode }) => {
    console.log(`> Call offer from ${userId} to ${targetId}`);
    io.to(targetId).emit('call:offer', { from: userId, offer, mode });
  });

  socket.on('call:answer', ({ targetId, answer }) => {
    console.log(`> Call answer from ${userId} to ${targetId}`);
    io.to(targetId).emit('call:answer', { answer });
  });

  socket.on('call:ice', ({ targetId, candidate }) => {
    io.to(targetId).emit('call:ice', { candidate });
  });

  socket.on('call:end', ({ targetId }) => {
    console.log(`> Call end by ${userId} for ${targetId}`);
    io.to(targetId).emit('call:end');
  });

  socket.on('chat:new', ({ targetId, chat }) => {
    console.log(`> New chat created for ${targetId}`);
    io.to(targetId).emit('chat:new', chat);
  });

  socket.on('disconnect', () => {
    console.log(`> User disconnected: ${userId}`);
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
    // Если есть ключи Cloudinary, грузим туда
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      console.log('> Uploading to Cloudinary...');
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "auto",
        folder: "flux_uploads"
      });
      // Удаляем временный файл
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      
      console.log('> Upload successful:', result.secure_url);
      return res.json({ 
        url: result.secure_url, 
        type: req.file.mimetype.startsWith('image/') ? 'image' : 
              req.file.mimetype.startsWith('video/') ? 'video' : 
              req.file.mimetype.startsWith('audio/') ? 'audio' : 'file'
      });
    }

    // Если нет Cloudinary, грузим локально (сотрется при деплое)
    console.log('> Cloudinary not configured, using local storage');
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
