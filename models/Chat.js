import { pool } from './database.js';
import crypto from 'crypto';

class Chat {
  static generateId(prefix = 'c') {
    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }

  static normalizeKind(kind = 'PERSONAL') {
    if (kind === 'CHAT' || kind === 'SAVED') return 'PERSONAL';
    if (kind === 'WORK' || kind === 'AI' || kind === 'CHANNEL' || kind === 'PERSONAL') return kind;
    return 'PERSONAL';
  }

  static async create({ title, kind = 'PERSONAL', preferPrisma = false }) {
    const chatId = crypto.randomUUID();
    const query = `
      INSERT INTO "Chat" (id, title, kind, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await pool.query(query, [chatId, title, Chat.normalizeKind(kind)]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM "Chat" WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async addMember(chatId, userId, role = 'member', preferPrisma = false) {
    const memberId = crypto.randomUUID();
    const query = `
      INSERT INTO "ChatMember" (id, "chatId", "userId", role, muted, "joinedAt")
      VALUES ($1, $2, $3, $4, false, CURRENT_TIMESTAMP)
      ON CONFLICT ("userId", "chatId") DO NOTHING
      RETURNING *
    `;
    const result = await pool.query(query, [memberId, chatId, userId, role]);
    return result.rows[0];
  }

  static async findUserChats(userId) {
    const query = `
      SELECT c.id, c.title, c.kind, c."isPinned", c."pinnedMessageId", c."createdAt", c."updatedAt",
             cm.role, cm.muted, cm."joinedAt",
             (SELECT "encryptedBody" FROM "Message" m WHERE m."chatId" = c.id ORDER BY m."createdAt" DESC LIMIT 1) as last_message
      FROM "Chat" c
      JOIN "ChatMember" cm ON c.id = cm."chatId"
      WHERE cm."userId" = $1
      ORDER BY c."updatedAt" DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findChatMembers(chatId) {
    const query = `
      SELECT u.id, u.name, u.avatar, u.status, u."lastSeen", cm.role
      FROM "User" u
      JOIN "ChatMember" cm ON u.id = cm."userId"
      WHERE cm."chatId" = $1
    `;
    const result = await pool.query(query, [chatId]);
    return result.rows;
  }

  static async findPersonalChat(userId1, userId2, preferPrisma = false) {
    const query = `
      SELECT c.*
      FROM "Chat" c
      JOIN "ChatMember" cm1 ON c.id = cm1."chatId"
      JOIN "ChatMember" cm2 ON c.id = cm2."chatId"
      WHERE c.kind = 'PERSONAL'
      AND c.title != '⭐️ Избранное'
      AND cm1."userId" = $1
      AND cm2."userId" = $2
      LIMIT 1
    `;
    const result = await pool.query(query, [userId1, userId2]);
    return result.rows[0];
  }
}

export default Chat;
