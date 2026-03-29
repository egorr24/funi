import { pool } from './database.js';

class Chat {
  static async create({ title, kind = 'PERSONAL' }) {
    const query = `
      INSERT INTO chats (title, kind)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [title, kind]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM chats WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async addMember(chatId, userId, role = 'member') {
    const query = `
      INSERT INTO chat_members (chat_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (chat_id, user_id) DO NOTHING
      RETURNING *
    `;
    const result = await pool.query(query, [chatId, userId, role]);
    return result.rows[0];
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
    const query = `
      SELECT c.*
      FROM chats c
      JOIN chat_members cm1 ON c.id = cm1.chat_id
      JOIN chat_members cm2 ON c.id = cm2.chat_id
      WHERE c.kind = 'PERSONAL'
      AND cm1.user_id = $1
      AND cm2.user_id = $2
      LIMIT 1
    `;
    const result = await pool.query(query, [userId1, userId2]);
    return result.rows[0];
  }
}

export default Chat;
