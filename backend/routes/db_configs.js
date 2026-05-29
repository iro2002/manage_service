import express from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireSuperAdmin);

// Use an environment variable or fallback to a hardcoded 32-byte key for demo purposes.
// IN PRODUCTION, ALWAYS USE A SECURE ENVIRONMENT VARIABLE: process.env.ENCRYPTION_KEY
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; 
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

// ─── GET /api/db-configs ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [configs] = await pool.query(
      'SELECT id, alias_name, host, port, db_username, created_by, created_at FROM saved_db_configs ORDER BY created_at DESC'
    );
    res.json(configs);
  } catch (err) {
    console.error('Error fetching db configs:', err);
    res.status(500).json({ error: 'Failed to fetch saved configurations.' });
  }
});

// ─── POST /api/db-configs ──────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { alias_name, host, port, db_username, password } = req.body;

  if (!alias_name || !host || !db_username || password === undefined) {
    return res.status(400).json({ error: 'Alias name, host, username, and password are required.' });
  }

  try {
    const encrypted = encrypt(password);
    
    const [result] = await pool.query(
      `INSERT INTO saved_db_configs (alias_name, host, port, db_username, encrypted_password, iv, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [alias_name, host, port || '3306', db_username, encrypted.encryptedData, encrypted.iv, req.user.email]
    );

    res.status(201).json({
      id: result.insertId,
      alias_name,
      host,
      port: port || '3306',
      db_username,
      created_by: req.user.email
    });
  } catch (err) {
    console.error('Error saving db config:', err);
    res.status(500).json({ error: 'Failed to save configuration.' });
  }
});

// ─── DELETE /api/db-configs/:id ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM saved_db_configs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Configuration deleted.' });
  } catch (err) {
    console.error('Error deleting db config:', err);
    res.status(500).json({ error: 'Failed to delete configuration.' });
  }
});

export default router;
