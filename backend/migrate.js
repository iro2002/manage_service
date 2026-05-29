import pool from './db.js';

async function migrate() {
  try {
    console.log("Adding columns to laptops table...");
    await pool.query('ALTER TABLE laptops ADD COLUMN IF NOT EXISTS windowsLicense BOOLEAN DEFAULT FALSE;');
    await pool.query('ALTER TABLE laptops ADD COLUMN IF NOT EXISTS msOfficePackage BOOLEAN DEFAULT FALSE;');
    await pool.query('ALTER TABLE laptops ADD COLUMN IF NOT EXISTS adminAccountEnabled BOOLEAN DEFAULT TRUE;');
    await pool.query('ALTER TABLE laptops ADD COLUMN IF NOT EXISTS massStorageDisabled BOOLEAN DEFAULT TRUE;');
    
    console.log("Creating saved_db_configs table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_db_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        alias_name VARCHAR(255) NOT NULL,
        host VARCHAR(255) NOT NULL,
        port VARCHAR(50) DEFAULT '3306',
        db_username VARCHAR(255) NOT NULL,
        encrypted_password TEXT NOT NULL,
        iv VARCHAR(255) NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Migration successful!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
