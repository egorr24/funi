import { pool } from './database.js';
import bcrypt from 'bcryptjs';

class User {
  static async create({ name, email, password, avatar = null, publicKey = null, encryptedPrivKey = null }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const query = `
      INSERT INTO users (name, email, password_hash, avatar, public_key, encrypted_priv_key)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, avatar, public_key, created_at
    `;
    
    const values = [name, email, hashedPassword, avatar, publicKey, encryptedPrivKey];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT id, name, email, avatar, public_key, encrypted_priv_key, status, last_seen, created_at
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateStatus(userId, status) {
    const query = `
      UPDATE users 
      SET status = $1, last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, status, last_seen
    `;
    const result = await pool.query(query, [status, userId]);
    return result.rows[0];
  }

  static async updateProfile(userId, { name, avatar, publicKey, encryptedPrivKey }) {
    const query = `
      UPDATE users 
      SET name = COALESCE($1, name), 
          avatar = COALESCE($2, avatar), 
          public_key = COALESCE($3, public_key),
          encrypted_priv_key = COALESCE($4, encrypted_priv_key),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, avatar, public_key, updated_at
    `;
    const result = await pool.query(query, [name, avatar, publicKey, encryptedPrivKey, userId]);
    return result.rows[0];
  }

  static async searchUsers(searchQuery, currentUserId) {
    const normalizedQuery = (searchQuery || "").trim();
    const wildcardQuery = `%${normalizedQuery.toLowerCase().replace(/\s+/g, "%")}%`;
    const compactNameQuery = `%${normalizedQuery.toLowerCase().replace(/\s+/g, "")}%`;
    const compactEmailQuery = `%${normalizedQuery.toLowerCase().replace(/[.\s]+/g, "")}%`;
    const query = `
      SELECT id, name, email, avatar, status
      FROM users 
      WHERE id != $2
      AND (
        $1 = ''
        OR LOWER(COALESCE(name, '')) LIKE $3
        OR LOWER(email) LIKE $3
        OR REPLACE(LOWER(COALESCE(name, '')), ' ', '') LIKE $4
        OR REPLACE(LOWER(email), '.', '') LIKE $5
      )
      ORDER BY
        CASE WHEN status = 'online' THEN 0 ELSE 1 END,
        COALESCE(updated_at, created_at) DESC,
        name ASC
      LIMIT 20
    `;
    const result = await pool.query(query, [normalizedQuery, currentUserId, wildcardQuery, compactNameQuery, compactEmailQuery]);
    if (result.rows.length > 0 || normalizedQuery === '') {
      return result.rows;
    }
    const fallbackQuery = `
      SELECT id, name, email, avatar, status
      FROM users
      WHERE id != $1
      ORDER BY
        CASE WHEN status = 'online' THEN 0 ELSE 1 END,
        COALESCE(updated_at, created_at) DESC,
        name ASC
      LIMIT 20
    `;
    const fallbackResult = await pool.query(fallbackQuery, [currentUserId]);
    return fallbackResult.rows;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

export default User;
