import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// ─── GET /api/db-employee-profiles ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [profiles] = await pool.query(
      'SELECT id, mysql_username, employee_name, department, created_at FROM employee_db_profiles ORDER BY employee_name ASC'
    );
    res.json(profiles);
  } catch (err) {
    console.error('Error fetching db employee profiles:', err);
    res.status(500).json({ error: 'Failed to fetch profiles.' });
  }
});

// ─── POST /api/db-employee-profiles ─────────────────────────────────────────
router.post('/', async (req, res) => {
  const { mysql_username, employee_name, department } = req.body;

  if (!mysql_username || !employee_name) {
    return res.status(400).json({ error: 'MySQL username and employee name are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO employee_db_profiles (mysql_username, employee_name, department) VALUES (?, ?, ?)`,
      [mysql_username.trim(), employee_name.trim(), department?.trim() || '']
    );

    res.status(201).json({
      id: result.insertId,
      mysql_username: mysql_username.trim(),
      employee_name: employee_name.trim(),
      department: department?.trim() || ''
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A profile with this MySQL username already exists.' });
    }
    console.error('Error creating db employee profile:', err);
    res.status(500).json({ error: 'Failed to create profile.' });
  }
});

// ─── DELETE /api/db-employee-profiles/:id ───────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employee_db_profiles WHERE id = ?', [req.params.id]);
    res.json({ message: 'Profile deleted.' });
  } catch (err) {
    console.error('Error deleting db employee profile:', err);
    res.status(500).json({ error: 'Failed to delete profile.' });
  }
});

export default router;
