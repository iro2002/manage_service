import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ code: 'auth/user-not-found', error: 'No account found with this email.' });
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

    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
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
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
