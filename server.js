import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import next from 'next';
import multer from 'multer';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';
import { createSocketServer } from './dist/server/server/socket.js';

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

import { initDatabase } from './models/database.js';

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
const io = createSocketServer(server);
app.set('io', io);

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
    if (cloudName && apiKey && apiSecret && !cloudName.includes("Root") && !cloudName.includes("root")) {
      console.log(`[UPLOAD] Cloudinary config check: Name=${cloudName.substring(0, 3)}... , Key=${apiKey.substring(0, 3)}...`);
      
      // Принудительно настраиваем Cloudinary прямо здесь
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
      });

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'flux_uploads',
        resource_type: 'auto'
      });

      console.log(`[UPLOAD] Cloudinary success: ${result.secure_url}`);

      // Удаляем временный файл после загрузки в облако
      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
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
    if (cloudName.toLowerCase().includes("root")) {
      console.warn(`[UPLOAD] WARNING: Cloudinary Cloud Name is set to 'Root'. This is likely a configuration error in Railway.`);
    } else {
      console.warn(`[UPLOAD] NO Cloudinary credentials! Saving to public/uploads (TEMPORARY).`);
    }
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
