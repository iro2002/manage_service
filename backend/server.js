import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { testConnection } from './db.js';

import authRoutes from './routes/auth.js';
import laptopRoutes from './routes/laptops.js';
import userRoutes from './routes/users.js';
import dbUsersRoutes from './routes/db_users.js';
import dbConfigsRoutes from './routes/db_configs.js';
import dbEmployeeProfilesRoutes from './routes/db_employee_profiles.js';
import gitlabRoutes from './routes/gitlab.js';
import configRoutes from './routes/config.js';
import serverRoutes from './routes/servers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json());

// ── Health check endpoint ────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: err.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/laptops', laptopRoutes);
app.use('/api/users', userRoutes);
app.use('/api/db-users', dbUsersRoutes);
app.use('/api/db-configs', dbConfigsRoutes);
app.use('/api/db-employee-profiles', dbEmployeeProfilesRoutes);
app.use('/api/gitlab', gitlabRoutes);
app.use('/api/config', configRoutes);
app.use('/api/servers', serverRoutes);

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);

  // Detect MySQL / DB errors
  const dbErrorCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'];
  if (dbErrorCodes.includes(err.code)) {
    return res.status(503).json({
      code: 'db/connection-error',
      error: 'Cannot connect to the database. Please try again later.'
    });
  }

  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;

// ── Start server ─────────────────────────────────────────────────────────────
const dbConnected = await testConnection();

if (!dbConnected) {
  console.warn('⚠️  Server starting WITHOUT a database connection. All DB operations will fail until the database is available.');
}

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
