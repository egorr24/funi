import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
const initDatabase = async () => {
  try {
    // Enable UUID extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // Users table (Prisma style)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id TEXT PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        "passwordHash" VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        "publicKey" TEXT,
        "encryptedPrivKey" TEXT,
        status VARCHAR(20) DEFAULT 'online',
        "lastSeen" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Chats table (Prisma style)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Chat" (
        id TEXT PRIMARY KEY,
        title VARCHAR(255),
        kind VARCHAR(20) DEFAULT 'PERSONAL',
        "isPinned" BOOLEAN DEFAULT false,
        "pinnedMessageId" TEXT,
        "hlsManifestUrl" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Chat Members table (Prisma style)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "ChatMember" (
        id TEXT PRIMARY KEY,
        "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
        "chatId" TEXT REFERENCES "Chat"(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        muted BOOLEAN DEFAULT false,
        "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "chatId")
      )
    `);

    // Messages table (Prisma style)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Message" (
        id TEXT PRIMARY KEY,
        "chatId" TEXT REFERENCES "Chat"(id) ON DELETE CASCADE,
        "senderId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
        "encryptedBody" TEXT,
        "encryptedAes" TEXT,
        iv TEXT,
        "mediaUrl" TEXT,
        "mediaType" VARCHAR(50),
        waveform TEXT,
        "replyToId" TEXT REFERENCES "Message"(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'QUEUED',
        "deliveredAt" TIMESTAMP,
        "readAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reactions table (Prisma style)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Reaction" (
        id TEXT PRIMARY KEY,
        emoji VARCHAR(10) NOT NULL,
        "messageId" TEXT REFERENCES "Message"(id) ON DELETE CASCADE,
        "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("messageId", "userId", emoji)
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_chat ON "Message"("chatId");
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON "Message"("senderId");
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON "Message"("createdAt");
      CREATE INDEX IF NOT EXISTS idx_chat_members_user ON "ChatMember"("userId");
      CREATE INDEX IF NOT EXISTS idx_chat_members_chat ON "ChatMember"("chatId");
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

export { pool, initDatabase };
