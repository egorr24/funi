const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const next = require('next');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const { initDatabase } = require('./models/database');

nextApp.prepare().then(() => {
  console.log('> Next.js app prepared');
  const app = express();
  const server = http.createServer(app);
  
  console.log('> Initializing Socket.io...');
  // Initialize Socket.io with the correct path expected by the client
  const io = socketIo(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"]
    }
  });

  // Store io instance for use in routes
  app.set('io', io);

  // Middleware (Next.js handles most of this, but we keep it for API routes)
  app.use(helmet({
    contentSecurityPolicy: false, // Required for Next.js in some cases
  }));
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Socket.io connection handling
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    const userId = socket.handshake.auth.userId;

    if (userId) {
      connectedUsers.set(userId, socket.id);
      io.emit('users_online', Array.from(connectedUsers.keys()));
    }

    socket.on('user_online', (id) => {
      connectedUsers.set(id, socket.id);
      io.emit('users_online', Array.from(connectedUsers.keys()));
    });

    socket.on('send_message', (data) => {
      const recipientSocketId = connectedUsers.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('new_message', data);
      }
    });

    socket.on('typing', (data) => {
      const recipientSocketId = connectedUsers.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user_typing', data);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      for (const [id, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(id);
          break;
        }
      }
      io.emit('users_online', Array.from(connectedUsers.keys()));
    });
  });

  // Handle all other requests with Next.js
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Ready on http://0.0.0.0:${PORT}`);
    
    // Also init the legacy DB if needed
    console.log('> Initializing legacy database...');
    initDatabase().catch(err => console.error('DB Init Error:', err));
  });
}).catch((ex) => {
  console.error('> Error during Next.js prepare:');
  console.error(ex.stack);
  process.exit(1);
});
