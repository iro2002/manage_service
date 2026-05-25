import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
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

export async function initDb() {
  try {
    // We create a temporary connection without database to create the database if it doesn't exist
    const tempPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    const dbName = process.env.DB_NAME || 'manage_service_db';
    await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempPool.end();

    console.log('Connected to MySQL database.');

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL DEFAULT '',
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Migrate existing users table: add new columns if they don't exist
    const addColumnIfNotExists = async (table, column, definition) => {
      try {
        const [cols] = await pool.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [table, column]
        );
        if (cols.length === 0) {
          await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
          console.log(`Added column '${column}' to '${table}'.`);
        }
      } catch (err) {
        // Column may already exist, safe to ignore
      }
    };

    await addColumnIfNotExists('users', 'name', "VARCHAR(255) NOT NULL DEFAULT '' AFTER id");
    await addColumnIfNotExists('users', 'is_active', "BOOLEAN DEFAULT TRUE AFTER role");
    await addColumnIfNotExists('users', 'updated_at', "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");

    // Upgrade existing admin user to super_admin (if still on old 'admin' role)
    await pool.query(
      "UPDATE users SET role = 'super_admin', name = CASE WHEN name = '' OR name IS NULL THEN 'Super Admin' ELSE name END WHERE email = 'admin@company.com' AND role = 'admin'"
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS laptops (
        id INT AUTO_INCREMENT PRIMARY KEY,
        model VARCHAR(255) NOT NULL,
        serialNo VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) NOT NULL,
        currentUserName VARCHAR(255) DEFAULT '',
        handoverDate VARCHAR(50) DEFAULT '',
        department VARCHAR(100) DEFAULT '',
        comments TEXT,
        dateOfDelivery VARCHAR(50) DEFAULT '',
        vendorName VARCHAR(255) DEFAULT '',
        hrRefNumber VARCHAR(255) DEFAULT '',
        ratePerMonth DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS laptop_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        laptopId INT NOT NULL,
        laptopModel VARCHAR(255) NOT NULL,
        serialNo VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        fromUser VARCHAR(255) DEFAULT '',
        toUser VARCHAR(255) DEFAULT '',
        department VARCHAR(100) DEFAULT '',
        actionDate VARCHAR(50) DEFAULT '',
        comments TEXT,
        performedBy VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (laptopId) REFERENCES laptops(id) ON DELETE CASCADE
      )
    `);

    // Seed admin user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@company.com']);
    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['Super Admin', 'admin@earrow.net', hashedPassword, 'super_admin']
      );
      console.log('Super Admin user seeded: admin@earrow.net / admin123');
    }

    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

export default pool;
