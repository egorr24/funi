import { pool } from './database.js';
import crypto from 'crypto';

class Message {
  static generateId(prefix = 'm') {
    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }

  static isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  static async create({ chatId, senderId, encryptedBody, encryptedAes, iv, mediaUrl, mediaType, waveform, replyToId }) {
    const messageId = crypto.randomUUID();
    const query = `
      INSERT INTO "Message" (id, "chatId", "senderId", "encryptedBody", "encryptedAes", iv, "mediaUrl", "mediaType", waveform, "replyToId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [messageId, chatId, senderId, encryptedBody, encryptedAes, iv, mediaUrl, mediaType, waveform, replyToId];
    const result = await pool.query(query, values);
    await pool.query('UPDATE "Chat" SET "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1', [chatId]);
    return result.rows[0];
  }

  static async findByChatId(chatId, limit = 50, offset = 0) {
    const query = `
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM "Message" m
      JOIN "User" u ON m."senderId" = u.id
      WHERE m."chatId" = $1
      ORDER BY m."createdAt" ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [chatId, limit, offset]);
    return result.rows;
  }

  static async markAsRead(messageId, userId) {
    const query = `
      UPDATE "Message" 
      SET "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [messageId]);
    return result.rows[0];
  }

  static async addReaction(messageId, userId, emoji) {
    const reactionId = crypto.randomUUID();
    const query = `
      INSERT INTO "Reaction" (id, "messageId", "userId", emoji, "createdAt")
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT ("messageId", "userId", emoji) DO NOTHING
      RETURNING *
    `;
    const result = await pool.query(query, [reactionId, messageId, userId, emoji]);
    return result.rows[0];
  }

  static async getReactions(messageId) {
    const query = `
      SELECT r.*, u.name as user_name
      FROM "Reaction" r
      JOIN "User" u ON r."userId" = u.id
      WHERE r."messageId" = $1
    `;
    const result = await pool.query(query, [messageId]);
    return result.rows;
  }
}

export default Message;
