const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const next = require('next');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const { initDatabase } = require('./models/database');

const app = express();
const server = http.createServer(app);

// 1. БЕСПРЕКОСЛОВНЫЙ HEALTH CHECK
// Возвращаем 200 на всё, что хочет Railway, СРАЗУ
app.get(['/health', '/login', '/'], (req, res, next) => {
  if (req.url === '/health' || !nextReady) {
    return res.status(200).send('OK');
  }
  next();
});

// 2. SOCKET.IO
const io = socketIo(server, {
  path: '/api/socket',
  cors: { origin: "*", methods: ["GET", "POST"] }
});
app.set('io', io);

// 3. MIDDLEWARE
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. NEXT.JS ПРЕПАРПАЦИЯ
let nextReady = false;
nextApp.prepare().then(() => {
  nextReady = true;
  console.log('> Next.js READY');
});

// 5. ОБРАБОТКА ЗАПРОСОВ
app.all('*', (req, res) => {
  if (!nextReady) {
    return res.status(200).send('Loading...');
  }
  return handle(req, res);
});

// 6. ЗАПУСК ПОРТА МГНОВЕННО
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`> ONLINE ON PORT ${PORT}`);
  initDatabase().catch(err => console.error('DB Error:', err));
});
