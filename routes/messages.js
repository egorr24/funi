const express = require('express');
const multer = require('multer');
const path = require('path');
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Send message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { recipientId, content, messageType = 'text', encrypted = false } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    if (messageType === 'text' && !content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await Message.create({
      senderId: req.user.id,
      recipientId,
      content,
      messageType,
      encrypted
    });

    // Emit real-time message via socket.io
    req.app.get('io')?.to(recipientId).emit('new_message', {
      id: message.id,
      senderId: req.user.id,
      senderName: req.user.display_name,
      recipientId,
      content: encrypted ? Message.decryptMessage(message.content) : message.content,
      messageType,
      createdAt: message.created_at,
      encrypted
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: {
        id: message.id,
        content: encrypted ? Message.decryptMessage(message.content) : message.content,
        messageType: message.message_type,
        createdAt: message.created_at
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send file message
router.post('/file', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { recipientId, encrypted = false } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    const message = await Message.create({
      senderId: req.user.id,
      recipientId,
      content: req.file.originalname,
      messageType: req.file.mimetype.startsWith('image/') ? 'image' : 
                 req.file.mimetype.startsWith('video/') ? 'video' : 'file',
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      encrypted
    });

    // Emit real-time message via socket.io
    req.app.get('io')?.to(recipientId).emit('new_message', {
      id: message.id,
      senderId: req.user.id,
      senderName: req.user.display_name,
      recipientId,
      content: message.content,
      messageType: message.message_type,
      fileUrl: message.file_url,
      fileName: message.file_name,
      fileSize: message.file_size,
      createdAt: message.created_at,
      encrypted
    });

    res.status(201).json({
      message: 'File sent successfully',
      data: {
        id: message.id,
        content: message.content,
        messageType: message.message_type,
        fileUrl: message.file_url,
        fileName: message.file_name,
        fileSize: message.file_size,
        createdAt: message.created_at
      }
    });
  } catch (error) {
    console.error('Send file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversation
router.get('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Message.getConversation(req.user.id, userId, limit, offset);

    // Decrypt encrypted messages
    const decryptedMessages = messages.map(msg => ({
      ...msg,
      content: msg.encrypted ? Message.decryptMessage(msg.content) : msg.content
    }));

    res.json({
      messages: decryptedMessages
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user.id);
    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark message as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.markAsRead(id, req.user.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({
      message: 'Message marked as read',
      data: {
        id: message.id,
        readAt: message.read_at
      }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread count
router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user.id);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
