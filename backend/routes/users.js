import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication + super admin
router.use(authMiddleware);
router.use(requireSuperAdmin);

// ─── GET /api/users — List all users ────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ─── POST /api/users — Create a new user ────────────────────────────────────
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const validRoles = ['admin', 'super_admin'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be "admin" or "super_admin".' });
  }

  try {
    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'admin';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashedPassword, userRole]
    );

    res.status(201).json({
      id: result.insertId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: userRole,
      is_active: true,
      message: 'User created successfully.'
    });
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// ─── PUT /api/users/:id — Update user details ──────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role, is_active } = req.body;

  try {
    // Check user exists
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targetUser = users[0];

    // Prevent modifying own role or deactivating self
    if (parseInt(id) === req.user.id) {
      if (role !== undefined && role !== targetUser.role) {
        return res.status(400).json({ error: 'You cannot change your own role.' });
      }
      if (is_active !== undefined && !is_active) {
        return res.status(400).json({ error: 'You cannot deactivate your own account.' });
      }
    }

    // Check email uniqueness if changing email
    if (email && email.trim().toLowerCase() !== targetUser.email) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email.trim().toLowerCase(), id]);
      if (existing.length > 0) {
        return res.status(409).json({ error: 'A user with this email already exists.' });
      }
    }

    const validRoles = ['admin', 'super_admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "admin" or "super_admin".' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email.trim().toLowerCase()); }
    if (role !== undefined) { updates.push('role = ?'); values.push(role); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    values.push(id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    // Fetch updated user
    const [updated] = await pool.query(
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.json({ ...updated[0], message: 'User updated successfully.' });
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// ─── PUT /api/users/:id/reset-password — Reset user password ────────────────
router.put('/:id/reset-password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, id]);

    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('Error resetting password:', err.message);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// ─── DELETE /api/users/:id — Delete a user ──────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // Cannot delete yourself
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }

  try {
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

export default router;
