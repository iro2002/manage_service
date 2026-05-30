import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'manage_service_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection on startup
export async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ Database connected successfully.');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Host    :', process.env.DB_HOST || 'localhost');
    console.error('   User    :', process.env.DB_USER || 'root');
    console.error('   Database:', process.env.DB_NAME || 'manage_service_db');
    console.error('   → Make sure MySQL is running and the .env credentials are correct.');
    return false;
  }
}

export default pool;
