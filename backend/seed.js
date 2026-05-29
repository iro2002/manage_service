
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'manage_service_db',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

async function seed() {
  try {
    const email = 'admin@earrow.net';
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existing.length > 0) {
      console.log(`✔ Super Admin user already exists (${email}). No changes made.`);
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (username, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'Super Admin', email, hashedPassword, 'super_admin']
      );
      console.log('✔ Super Admin user seeded successfully!');

    }
  } catch (error) {
    console.error('✖ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
