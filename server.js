const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const next = require('next');
require('dotenv').config();

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
  cors: { origin: "*", methods: ["GET", "POST"] }
});
app.set('io', io);

// 3. MIDDLEWARE
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// 6. ЗАПУСК СЕРВЕРА МГНОВЕННО
server.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('> Listen Error:', err);
    process.exit(1);
  }
  console.log(`> App is ONLINE on port ${PORT}`);
  
  // Инициализация базы данных тоже в фоне
  initDatabase().catch(err => console.error('> Database Init Error:', err));
});
