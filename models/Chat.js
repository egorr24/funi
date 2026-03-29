import { pool } from './database.js';

class Chat {
  static generateId(prefix = 'c') {
    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }

  static normalizeKind(kind = 'PERSONAL') {
    if (kind === 'CHAT' || kind === 'SAVED') return 'PERSONAL';
    if (kind === 'WORK' || kind === 'AI' || kind === 'CHANNEL' || kind === 'PERSONAL') return kind;
    return 'PERSONAL';
  }

  static async create({ title, kind = 'PERSONAL' }) {
    try {
      const query = `
        INSERT INTO chats (title, kind)
        VALUES ($1, $2)
        RETURNING *
      `;
      const result = await pool.query(query, [title, kind]);
      return result.rows[0];
    } catch (_error) {
      const query = `
        INSERT INTO "Chat" ("id", "title", "kind", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const id = Chat.generateId('cht_');
      const result = await pool.query(query, [id, title, Chat.normalizeKind(kind)]);
      return result.rows[0];
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM chats WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async addMember(chatId, userId, role = 'member') {
    try {
      const query = `
        INSERT INTO chat_members (chat_id, user_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (chat_id, user_id) DO NOTHING
        RETURNING *
      `;
      const result = await pool.query(query, [chatId, userId, role]);
      return result.rows[0];
    } catch (_error) {
      const query = `
        INSERT INTO "ChatMember" ("id", "chatId", "userId", "role", "muted", "joinedAt")
        VALUES ($1, $2, $3, $4, false, CURRENT_TIMESTAMP)
        ON CONFLICT ("userId", "chatId") DO NOTHING
        RETURNING *
      `;
      const id = Chat.generateId('cm_');
      const result = await pool.query(query, [id, chatId, userId, role]);
      return result.rows[0];
    }
  }

  static async findUserChats(userId) {
    const query = `
      SELECT c.*, cm.role, cm.muted, cm.joined_at,
             (SELECT m.encrypted_body FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
      FROM chats c
      JOIN chat_members cm ON c.id = cm.chat_id
      WHERE cm.user_id = $1
      ORDER BY c.updated_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findChatMembers(chatId) {
    const query = `
      SELECT u.id, u.name, u.avatar, u.status, u.last_seen, cm.role
      FROM users u
      JOIN chat_members cm ON u.id = cm.user_id
      WHERE cm.chat_id = $1
    `;
    const result = await pool.query(query, [chatId]);
    return result.rows;
  }

  static async findPersonalChat(userId1, userId2) {
    try {
      const query = `
        SELECT c.*
        FROM chats c
        JOIN chat_members cm1 ON c.id = cm1.chat_id
        JOIN chat_members cm2 ON c.id = cm2.chat_id
        WHERE c.kind::text IN ('PERSONAL', 'CHAT')
        AND c.title != '⭐️ Избранное'
        AND cm1.user_id = $1
        AND cm2.user_id = $2
        LIMIT 1
      `;
      const result = await pool.query(query, [userId1, userId2]);
      return result.rows[0];
    } catch (_error) {
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
}

export default Chat;
