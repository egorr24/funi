const { pool } = require('./database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ username, email, password, displayName }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const query = `
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, display_name, created_at
    `;
    
    const values = [username, email, hashedPassword, displayName];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT id, username, email, display_name, avatar_url, status, last_seen, created_at
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

  static async updateProfile(userId, { displayName, avatarUrl }) {
    const query = `
      UPDATE users 
      SET display_name = $1, avatar_url = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, display_name, avatar_url, updated_at
    `;
    const result = await pool.query(query, [displayName, avatarUrl, userId]);
    return result.rows[0];
  }

  static async searchUsers(query, currentUserId) {
    const searchQuery = `
      SELECT id, username, display_name, avatar_url, status
      FROM users 
      WHERE (username ILIKE $1 OR display_name ILIKE $1)
      AND id != $2
      ORDER BY username
      LIMIT 20
    `;
    const result = await pool.query(searchQuery, [`%${query}%`, currentUserId]);
    return result.rows;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
