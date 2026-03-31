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
        const mergedUsers = [];
        try {
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
            mergedUsers.push(...result.rows);
        }
        catch (_error) { }
        const seenEmails = new Set(mergedUsers
            .map((user) => (user.email || "").toLowerCase())
            .filter(Boolean));
        try {
            const legacyQuery = `
        SELECT id, name, email, avatar
        FROM "User"
        WHERE id::text != $2
        AND (
          $1 = ''
          OR LOWER(COALESCE(name, '')) LIKE $3
          OR LOWER(email) LIKE $3
          OR REPLACE(LOWER(COALESCE(name, '')), ' ', '') LIKE $4
          OR REPLACE(LOWER(email), '.', '') LIKE $5
        )
        ORDER BY name ASC
        LIMIT 20
      `;
            const legacyResult = await pool.query(legacyQuery, [normalizedQuery, String(currentUserId), wildcardQuery, compactNameQuery, compactEmailQuery]);
            for (const legacyUser of legacyResult.rows) {
                const email = (legacyUser.email || "").toLowerCase();
                if (!email || seenEmails.has(email))
                    continue;
                seenEmails.add(email);
                mergedUsers.push({
                    id: legacyUser.id,
                    name: legacyUser.name,
                    email: legacyUser.email,
                    avatar: legacyUser.avatar,
                    status: "offline",
                });
                if (mergedUsers.length >= 20)
                    break;
            }
        }
        catch (_error) { }
        if (mergedUsers.length > 0 || normalizedQuery === "") {
            return mergedUsers.slice(0, 20);
        }
        try {
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
        catch (_error) { }
        try {
            const fallbackLegacy = await pool.query(`
        SELECT id, name, email, avatar
        FROM "User"
        WHERE id::text != $1
        ORDER BY name ASC
        LIMIT 20
      `, [String(currentUserId)]);
            return fallbackLegacy.rows.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                status: "offline",
            }));
        }
        catch (_error) {
            return [];
        }
    }
    static async resolveAppUserId(externalUserId) {
        try {
            const ownUser = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [externalUserId]);
            if (ownUser.rows[0]?.id) {
                return ownUser.rows[0].id;
            }
        }
        catch (_error) { }
        try {
            const ownLegacy = await pool.query('SELECT id FROM "User" WHERE id = $1 LIMIT 1', [externalUserId]);
            if (ownLegacy.rows[0]?.id) {
                return ownLegacy.rows[0].id;
            }
        }
        catch (_error) { }
        try {
            const legacyUserResult = await pool.query(`
        SELECT id, name, email, avatar, "passwordHash" as password_hash
        FROM "User"
        WHERE id = $1
        LIMIT 1
      `, [externalUserId]);
            const legacyUser = legacyUserResult.rows[0];
            if (!legacyUser?.email) {
                return null;
            }
            try {
                const existingByEmail = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [legacyUser.email]);
                if (existingByEmail.rows[0]?.id) {
                    return existingByEmail.rows[0].id;
                }
            }
            catch (_error) {
                return legacyUser.id;
            }
            const inserted = await pool.query(`
        INSERT INTO users (name, email, password_hash, avatar)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
                legacyUser.name || legacyUser.email.split("@")[0],
                legacyUser.email,
                legacyUser.password_hash || "$2b$10$7EqJtq98hPqEX7fNZaFWoO5x0xYv7FpC18JNpDutLCRa14Q6gttxy",
                legacyUser.avatar || null,
            ]);
            return inserted.rows[0]?.id || null;
        }
        catch (_error) {
            return null;
        }
    }
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}
export default User;
