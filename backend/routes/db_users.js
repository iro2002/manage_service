import express from 'express';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireSuperAdmin);

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; 
const ALGORITHM = 'aes-256-cbc';

function decrypt(hash) {
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), Buffer.from(hash.iv, 'hex'));
  let decrypted = decipher.update(Buffer.from(hash.encryptedData, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

router.post('/', async (req, res) => {
  const { host, port, user, password, configId } = req.body;
  let connectionPool = pool;
  let isCustom = false;

  try {
    if (configId) {
      // Fetch saved config from database
      const [rows] = await pool.query('SELECT host, port, db_username, encrypted_password, iv FROM saved_db_configs WHERE id = ?', [configId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Saved configuration not found.' });
      
      const config = rows[0];
      const decPassword = decrypt({ iv: config.iv, encryptedData: config.encrypted_password });
      
      isCustom = true;
      connectionPool = mysql.createPool({
        host: config.host,
        port: config.port || 3306,
        user: config.db_username,
        password: decPassword,
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0
      });
    } else if (host && user) {
      isCustom = true;
      connectionPool = mysql.createPool({
        host: host,
        port: port || 3306,
        user: user,
        password: password || '',
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0
      });
    }

    // 1. Fetch Global Privileges
    const [globalUsers] = await connectionPool.query(
      `SELECT User, Host, Select_priv, Insert_priv, Update_priv, Delete_priv, Create_priv, Drop_priv, Grant_priv, Super_priv
       FROM mysql.user
       WHERE User != ''`
    );

    // 2. Fetch DB-Specific Privileges
    const [dbPrivileges] = await connectionPool.query(
      `SELECT User, Host, Db, Select_priv, Insert_priv, Update_priv, Delete_priv, Create_priv, Drop_priv, Grant_priv
       FROM mysql.db
       WHERE User != ''`
    );

    if (isCustom) {
      await connectionPool.end();
    }

    // 3. Aggregate into a cohesive list
    const userMap = new Map();

    globalUsers.forEach(u => {
      const key = `${u.User}@${u.Host}`;
      userMap.set(key, {
        user: u.User,
        host: u.Host,
        global_privileges: {
          select: u.Select_priv === 'Y',
          insert: u.Insert_priv === 'Y',
          update: u.Update_priv === 'Y',
          delete: u.Delete_priv === 'Y',
          create: u.Create_priv === 'Y',
          drop: u.Drop_priv === 'Y',
          grant: u.Grant_priv === 'Y',
          super: u.Super_priv === 'Y',
        },
        databases: []
      });
    });

    dbPrivileges.forEach(dbPriv => {
      const key = `${dbPriv.User}@${dbPriv.Host}`;
      if (!userMap.has(key)) {
        // Fallback if user exists in db table but not in user table (rare, but possible)
        userMap.set(key, {
          user: dbPriv.User,
          host: dbPriv.Host,
          global_privileges: {},
          databases: []
        });
      }

      userMap.get(key).databases.push({
        db: dbPriv.Db,
        select: dbPriv.Select_priv === 'Y',
        insert: dbPriv.Insert_priv === 'Y',
        update: dbPriv.Update_priv === 'Y',
        delete: dbPriv.Delete_priv === 'Y',
        create: dbPriv.Create_priv === 'Y',
        drop: dbPriv.Drop_priv === 'Y',
        grant: dbPriv.Grant_priv === 'Y',
      });
    });

    res.json(Array.from(userMap.values()));
  } catch (err) {
    if (isCustom && connectionPool !== pool) {
      try { await connectionPool.end(); } catch (e) {}
    }
    console.error('Error fetching DB users and privileges:', err.message);
    if (err.code === 'ER_TABLEACCESS_DENIED_ERROR') {
      return res.status(403).json({ error: 'Database user does not have permission to read mysql.user/mysql.db tables. Please grant SELECT privileges.' });
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(400).json({ error: 'Could not connect to the remote server. Please check the Host and Port.' });
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      return res.status(401).json({ error: 'Access denied for the provided database user credentials.' });
    }
    res.status(500).json({ error: 'Failed to fetch database privileges: ' + err.message });
  }
});

export default router;
