import { pool } from './database.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

class User {
  static async create({ name, email, password, avatar = null, publicKey = null, encryptedPrivKey = null }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();
    
    const query = `
      INSERT INTO "User" (id, name, email, "passwordHash", avatar, "publicKey", "encryptedPrivKey", status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'online', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, email, avatar, "publicKey", "createdAt", status
    `;
    
    const values = [userId, name, email, hashedPassword, avatar, publicKey, encryptedPrivKey];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = `
      SELECT id, name, email, "passwordHash" as password_hash, avatar, "publicKey", 
             "encryptedPrivKey", status, "lastSeen", "createdAt", "updatedAt"
      FROM "User"
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findByUsername(username) {
    const query = `
      SELECT id, name, email, "passwordHash" as password_hash, avatar, "publicKey", 
             "encryptedPrivKey", status, "lastSeen", "createdAt", "updatedAt"
      FROM "User"
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1
    `;
    const result = await pool.query(query, [username]);
    return result.rows[0] || null;
  }

  static async findById(id) {
    const query = `
      SELECT id, name, email, avatar, "publicKey", "encryptedPrivKey", status, "lastSeen", "createdAt", "updatedAt"
      FROM "User" WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async updateStatus(userId, status) {
    const query = `
      UPDATE "User" 
      SET status = $1, "lastSeen" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, status, "lastSeen"
    `;
    const result = await pool.query(query, [status, userId]);
    return result.rows[0];
  }

  static async updateProfile(userId, { name, avatar, publicKey, encryptedPrivKey }) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (avatar !== undefined) {
      updates.push(`avatar = $${paramCount}`);
      values.push(avatar);
      paramCount++;
    }
    if (publicKey) {
      updates.push(`"publicKey" = $${paramCount}`);
      values.push(publicKey);
      paramCount++;
    }
    if (encryptedPrivKey) {
      updates.push(`"encryptedPrivKey" = $${paramCount}`);
      values.push(encryptedPrivKey);
      paramCount++;
    }

    const query = `
      UPDATE "User" 
      SET ${updates.join(', ')}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, name, avatar, "publicKey", "updatedAt"
    `;
    
    values.push(userId);
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async searchUsers(searchQuery, currentUserId) {
    const normalizedQuery = (searchQuery || '').trim();
    const wildcardQuery = `%${normalizedQuery.toLowerCase().replace(/\s+/g, '%')}%`;

    const query = `
      SELECT id, name, email, avatar, status
      FROM "User"
      WHERE id != $1
      AND (
        $2 = ''
        OR LOWER(COALESCE(name, '')) LIKE $3
        OR LOWER(email) LIKE $3
      )
      ORDER BY
        CASE WHEN status = 'online' THEN 0 ELSE 1 END,
        "lastSeen" DESC,
        name ASC
      LIMIT 20
    `;
    
    const result = await pool.query(query, [currentUserId, normalizedQuery, wildcardQuery]);
    return result.rows;
  }

  static async resolveAppUserId(externalUserId) {
    try {
      const ownUser = await pool.query('SELECT id FROM "User" WHERE id = $1 LIMIT 1', [externalUserId]);
      if (ownUser.rows[0]?.id) {
        return ownUser.rows[0].id;
      }
    } catch (_error) {}
    return externalUserId;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

export default User;
