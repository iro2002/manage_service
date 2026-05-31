import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const [users] = await pool.query('SELECT id, username, name, email, password_hash, role, is_active, page_permissions FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({ code: 'auth/user-not-found', error: 'No account found with this username.' });
    }

    const user = users[0];

    // Check if user account is deactivated
    if (!user.is_active) {
      return res.status(401).json({ code: 'auth/account-disabled', error: 'Your account has been deactivated. Contact a Super Admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ code: 'auth/wrong-password', error: 'Incorrect password.' });
    }

    // Parse page_permissions from JSON string if stored as string
    let pagePerm = null;
    if (user.page_permissions) {
      try {
        pagePerm = typeof user.page_permissions === 'string'
          ? JSON.parse(user.page_permissions)
          : user.page_permissions;
      } catch { pagePerm = null; }
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        page_permissions: pagePerm
      }
    };

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_123';
    
    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload.user });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);

    const dbErrorCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'];
    if (dbErrorCodes.includes(err.code)) {
      return res.status(503).json({
        code: 'db/connection-error',
        error: 'Cannot connect to the database. Please check your connection and try again.'
      });
    }

    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
