import { pool } from './database.js';

class Message {
  static generateId(prefix = 'm') {
    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }

  static isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  static async create({ chatId, senderId, encryptedBody, encryptedAes, iv, mediaUrl, mediaType, waveform, replyToId }) {
    const preferPrisma = !Message.isUuid(chatId) || !Message.isUuid(senderId);
    if (preferPrisma) {
      const query = `
        INSERT INTO "Message" ("id", "chatId", "senderId", "encryptedBody", "encryptedAes", "iv", "mediaUrl", "mediaType", "waveform", "replyToId", "status", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const id = Message.generateId('msg_');
      const values = [id, chatId, senderId, encryptedBody, encryptedAes, iv, mediaUrl, mediaType, waveform, replyToId];
      const result = await pool.query(query, values);
      await pool.query('UPDATE "Chat" SET "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1', [chatId]);
      return result.rows[0];
    }
    const query = `
      INSERT INTO messages (chat_id, sender_id, encrypted_body, encrypted_aes, iv, media_url, media_type, waveform, reply_to_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [chatId, senderId, encryptedBody, encryptedAes, iv, mediaUrl, mediaType, waveform, replyToId];
    const result = await pool.query(query, values);
    
    // Update chat's updated_at
    await pool.query('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [chatId]);
    
    return result.rows[0];
  }

  static async findByChatId(chatId, limit = 50, offset = 0) {
    const query = `
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [chatId, limit, offset]);
    return result.rows;
  }

  static async markAsRead(messageId, userId) {
    // Note: In a chat-based system, we might need a more complex read status (per member)
    // For now, let's just mark the message itself as read if the recipient is the one marking it
    // But since it's a group/chat, we'll just update the read_at timestamp
    const query = `
      UPDATE messages 
      SET read_at = CURRENT_TIMESTAMP, status = 'READ'
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [messageId]);
    return result.rows[0];
  }

  static async addReaction(messageId, userId, emoji) {
    const query = `
      INSERT INTO reactions (message_id, user_id, emoji)
      VALUES ($1, $2, $3)
      ON CONFLICT (message_id, user_id, emoji) DO NOTHING
      RETURNING *
    `;
    const result = await pool.query(query, [messageId, userId, emoji]);
    return result.rows[0];
  }

  static async getReactions(messageId) {
    const query = `
      SELECT r.*, u.name as user_name
      FROM reactions r
      JOIN users u ON r.user_id = u.id
      WHERE r.message_id = $1
    `;
    const result = await pool.query(query, [messageId]);
    return result.rows;
  }
}

export default Message;
