import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// ─── Ensure config_id column exists (safe migration) ────────────────────────
async function ensureConfigIdColumn() {
  try {
    await pool.query(`
      ALTER TABLE employee_db_profiles
      ADD COLUMN IF NOT EXISTS config_id INT NULL DEFAULT NULL COMMENT 'NULL = Local DB, FK to saved_db_configs.id'
    `);
    // Also drop old unique constraint on mysql_username alone if it exists,
    // and add a composite unique on (mysql_username, config_id)
    // We do this safely by catching errors.
    try {
      await pool.query(`ALTER TABLE employee_db_profiles DROP INDEX mysql_username`);
    } catch (e) { /* already dropped or different name */ }
    try {
      await pool.query(`ALTER TABLE employee_db_profiles ADD UNIQUE KEY uniq_user_config (mysql_username, config_id)`);
    } catch (e) { /* already exists */ }
  } catch (err) {
    console.warn('[employee_db_profiles] Migration note:', err.message);
  }
}
ensureConfigIdColumn();

// ─── GET /api/db-employee-profiles ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [profiles] = await pool.query(
      `SELECT p.id, p.mysql_username, p.employee_name, p.department, p.config_id, p.created_at,
              c.alias_name AS server_alias, c.host AS server_host
       FROM employee_db_profiles p
       LEFT JOIN saved_db_configs c ON p.config_id = c.id
       ORDER BY p.employee_name ASC`
    );
    res.json(profiles);
  } catch (err) {
    console.error('Error fetching db employee profiles:', err);
    res.status(500).json({ error: 'Failed to fetch profiles.' });
  }
});

// ─── POST /api/db-employee-profiles ─────────────────────────────────────────
router.post('/', async (req, res) => {
  const { mysql_username, employee_name, department, config_id } = req.body;

  if (!mysql_username || !employee_name) {
    return res.status(400).json({ error: 'MySQL username and employee name are required.' });
  }

  const configIdVal = config_id || null;

  try {
    const [result] = await pool.query(
      `INSERT INTO employee_db_profiles (mysql_username, employee_name, department, config_id) VALUES (?, ?, ?, ?)`,
      [mysql_username.trim(), employee_name.trim(), department?.trim() || '', configIdVal]
    );

    res.status(201).json({
      id: result.insertId,
      mysql_username: mysql_username.trim(),
      employee_name: employee_name.trim(),
      department: department?.trim() || '',
      config_id: configIdVal,
      server_alias: null,
      server_host: null,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A profile with this MySQL username already exists on this server.' });
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
