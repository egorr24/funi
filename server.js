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

// 1. IMMEDIATE HEALTH CHECK
// This responds even before Next.js is prepared
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/', (req, res, next) => {
  if (req.url === '/health') return next();
  if (!nextReady) {
    return res.status(200).send('Server is starting, please wait...');
  }
  next();
});

// 2. SOCKET.IO SETUP
const io = socketIo(server, {
  path: '/api/socket',
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});

app.set('io', io);

// 3. MIDDLEWARE
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. SOCKET HANDLING
const connectedUsers = new Map();
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  if (userId) {
    connectedUsers.set(userId, socket.id);
    io.emit('users_online', Array.from(connectedUsers.keys()));
  }
  socket.on('disconnect', () => {
    for (const [id, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(id);
        break;
      }
    }
    io.emit('users_online', Array.from(connectedUsers.keys()));
  });
});

// 5. NEXT.JS HANDLER (WAIT FOR PREPARE)
let nextReady = false;
nextApp.prepare().then(() => {
  nextReady = true;
  console.log('> Next.js app prepared');
}).catch(err => {
  console.error('> Next.js prepare failed:', err);
});

app.all('*', (req, res) => {
  if (!nextReady && req.url !== '/health') {
    return res.status(503).send('Server is starting...');
  }
  return handle(req, res);
});

// 6. START SERVER IMMEDIATELY
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('> Server failed to start:', err);
    process.exit(1);
  }
  console.log(`> Server listening on http://0.0.0.0:${PORT}`);
  
  const maskedDbUrl = (process.env.DATABASE_URL || '').replace(/:([^@]+)@/, ':****@');
  console.log(`> Connecting to DB: ${maskedDbUrl}`);
  
  initDatabase().catch(err => console.error('DB Init Error:', err));
});
