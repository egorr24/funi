const { pool } = require('./database');
const crypto = require('crypto');

class Message {
  static async create({ senderId, recipientId, content, messageType = 'text', fileUrl, fileName, fileSize, encrypted = false }) {
    let encryptedContent = content;
    
    if (encrypted && content) {
      const algorithm = 'aes-256-gcm';
      const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default32characterencryptionkey!', 'utf8');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key, iv);
      
      let encrypted = cipher.update(content, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      encryptedContent = JSON.stringify({
        encrypted,
        iv: iv.toString('hex'),
        authTag: cipher.getAuthTag().toString('hex')
      });
    }

    const query = `
      INSERT INTO messages (sender_id, recipient_id, content, message_type, file_url, file_name, file_size, encrypted)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [senderId, recipientId, encryptedContent, messageType, fileUrl, fileName, fileSize, encrypted];
    const result = await pool.query(query, values);
    
    // Update conversation
    await this.updateConversation(senderId, recipientId, result.rows[0].id);
    
    return result.rows[0];
  }

  static async getConversation(userId1, userId2, limit = 50, offset = 0) {
    const query = `
      SELECT m.*, 
             u1.display_name as sender_name,
             u1.avatar_url as sender_avatar,
             u2.display_name as recipient_name,
             u2.avatar_url as recipient_avatar
      FROM messages m
      JOIN users u1 ON m.sender_id = u1.id
      JOIN users u2 ON m.recipient_id = u2.id
      WHERE (m.sender_id = $1 AND m.recipient_id = $2) 
         OR (m.sender_id = $2 AND m.recipient_id = $1)
      ORDER BY m.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const result = await pool.query(query, [userId1, userId2, limit, offset]);
    return result.rows.reverse();
  }

  static async markAsRead(messageId, userId) {
    const query = `
      UPDATE messages 
      SET read_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND recipient_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [messageId, userId]);
    return result.rows[0];
  }

  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM messages 
      WHERE recipient_id = $1 AND read_at IS NULL
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  static async updateConversation(userId1, userId2, messageId) {
    const query = `
      INSERT INTO conversations (user1_id, user2_id, last_message_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user1_id, user2_id) 
      DO UPDATE SET 
        last_message_id = $3,
        updated_at = CURRENT_TIMESTAMP
    `;
    await pool.query(query, [userId1, userId2, messageId]);
  }

  static async getUserConversations(userId) {
    const query = `
      SELECT DISTINCT 
        CASE 
          WHEN c.user1_id = $1 THEN c.user2_id 
          ELSE c.user1_id 
        END as other_user_id,
        u.display_name,
        u.avatar_url,
        u.status,
        m.content as last_message,
        m.created_at as last_message_time,
        m.message_type,
        (SELECT COUNT(*) FROM messages WHERE recipient_id = $1 AND sender_id = other_user_id AND read_at IS NULL) as unread_count
      FROM conversations c
      JOIN users u ON (
        CASE 
          WHEN c.user1_id = $1 THEN c.user2_id 
          ELSE c.user1_id 
        END = u.id
      )
      LEFT JOIN messages m ON c.last_message_id = m.id
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY m.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static decryptMessage(encryptedContent) {
    if (!encryptedContent) return null;
    
    try {
      const { encrypted, iv, authTag } = JSON.parse(encryptedContent);
      const algorithm = 'aes-256-gcm';
      const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default32characterencryptionkey!', 'utf8');
      
      const decipher = crypto.createDecipher(algorithm, key, Buffer.from(iv, 'hex'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedContent;
    }
  }
}

module.exports = Message;
