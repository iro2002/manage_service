import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// ─── GET /api/servers ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [servers] = await pool.query('SELECT * FROM servers ORDER BY created_at DESC');
    const [disks] = await pool.query('SELECT * FROM server_disks');
    
    // Attach disks to servers
    const serversWithDisks = servers.map(s => {
      return {
        ...s,
        disks: disks.filter(d => d.server_id === s.id)
      };
    });

    res.json(serversWithDisks);
  } catch (err) {
    console.error('Error fetching servers:', err);
    res.status(500).json({ error: 'Failed to fetch servers.' });
  }
});

// ─── POST /api/servers ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { 
    name, server_type, cpu_cores, ram, root_disk, ip_address, os, current_version, 
    php_version, mariadb_version, apache_version, status, disks 
  } = req.body;

  if (!name || !server_type) {
    return res.status(400).json({ error: 'Name and Server Type are required.' });
  }
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO servers (name, server_type, cpu_cores, ram, root_disk, ip_address, os, current_version, php_version, mariadb_version, apache_version, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, server_type, cpu_cores || '', ram || '', root_disk || '', ip_address || '', 
        os || '', current_version || '', php_version || '', mariadb_version || '', apache_version || '', status || 'active'
      ]
    );

    const serverId = result.insertId;

    if (disks && Array.isArray(disks) && disks.length > 0) {
      for (const disk of disks) {
        if (disk.mount_point && disk.disk_size) {
          await conn.query(
            `INSERT INTO server_disks (server_id, mount_point, disk_size) VALUES (?, ?, ?)`,
            [serverId, disk.mount_point, disk.disk_size]
          );
        }
      }
    }

    await conn.commit();
    res.status(201).json({ id: serverId, message: 'Server created successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Error adding server:', err);
    res.status(500).json({ error: 'Failed to add server.' });
  } finally {
    conn.release();
  }
});

// ─── PUT /api/servers/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const serverId = req.params.id;
  const { 
    name, server_type, cpu_cores, ram, root_disk, ip_address, os, current_version, 
    php_version, mariadb_version, apache_version, status, disks 
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE servers SET name = ?, server_type = ?, cpu_cores = ?, ram = ?, root_disk = ?, ip_address = ?, os = ?, current_version = ?, php_version = ?, mariadb_version = ?, apache_version = ?, status = ? WHERE id = ?`,
      [name, server_type, cpu_cores, ram, root_disk, ip_address, os, current_version, php_version, mariadb_version, apache_version, status, serverId]
    );

    if (disks && Array.isArray(disks)) {
      // Replace all disks for this server
      await conn.query(`DELETE FROM server_disks WHERE server_id = ?`, [serverId]);
      for (const disk of disks) {
        if (disk.mount_point && disk.disk_size) {
          await conn.query(
            `INSERT INTO server_disks (server_id, mount_point, disk_size) VALUES (?, ?, ?)`,
            [serverId, disk.mount_point, disk.disk_size]
          );
        }
      }
    }

    await conn.commit();
    res.json({ message: 'Server updated successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating server:', err);
    res.status(500).json({ error: 'Failed to update server.' });
  } finally {
    conn.release();
  }
});

// ─── DELETE /api/servers/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM servers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Server deleted successfully' });
  } catch (err) {
    console.error('Error deleting server:', err);
    res.status(500).json({ error: 'Failed to delete server.' });
  }
});

// ─── GET /api/servers/:id/updates ─────────────────────────────────────────────
router.get('/:id/updates', async (req, res) => {
  try {
    const [updates] = await pool.query(
      'SELECT * FROM server_updates WHERE server_id = ? ORDER BY update_date DESC, created_at DESC',
      [req.params.id]
    );
    res.json(updates);
  } catch (err) {
    console.error('Error fetching server updates:', err);
    res.status(500).json({ error: 'Failed to fetch updates.' });
  }
});

// ─── POST /api/servers/:id/updates ────────────────────────────────────────────
router.post('/:id/updates', async (req, res) => {
  const serverId = req.params.id;
  const { update_date, next_update_date, update_types, notes, current_version, updated_by } = req.body;

  if (!update_date || !next_update_date || !update_types || !update_types.length) {
    return res.status(400).json({ error: 'Update date, next update date, and at least one update type are required.' });
  }

  // Enforce update date between 10th and 20th
  const uDate = new Date(update_date);
  const dayOfMonth = uDate.getDate();
  if (dayOfMonth < 10 || dayOfMonth > 20) {
    return res.status(400).json({ error: 'Updates can only be logged between the 10th and 20th of the month.' });
  }

  // Join types array into comma-separated string
  const update_type = Array.isArray(update_types) ? update_types.join(', ') : update_types;
  const performedBy = updated_by || req.user.email;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert update record
    await conn.query(
      `INSERT INTO server_updates (server_id, update_date, next_update_date, update_type, updated_by, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [serverId, update_date, next_update_date, update_type, performedBy, notes || '']
    );

    // Update the server's tracking fields
    let updateServerQuery = `UPDATE servers SET last_update_date = ?, next_update_date = ?`;
    let updateParams = [update_date, next_update_date];

    if (current_version) {
      updateServerQuery += `, current_version = ?`;
      updateParams.push(current_version);
    }

    updateServerQuery += ` WHERE id = ?`;
    updateParams.push(serverId);

    await conn.query(updateServerQuery, updateParams);

    await conn.commit();
    res.status(201).json({ message: 'Update logged successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Error logging server update:', err);
    res.status(500).json({ error: 'Failed to log update.' });
  } finally {
    conn.release();
  }
});

export default router;
