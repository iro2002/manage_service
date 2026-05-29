import pool from './db.js';

async function migrate() {
  try {
    console.log("Adding columns to laptops table...");
    await pool.query('ALTER TABLE laptops ADD COLUMN IF NOT EXISTS windowsLicense BOOLEAN DEFAULT FALSE;');
    await pool.query('ALTER TABLE laptops ADD COLUMN IF NOT EXISTS msOfficePackage BOOLEAN DEFAULT FALSE;');
    await pool.query('ALTER TABLE laptops ADD COLUMN IF NOT EXISTS adminAccountEnabled BOOLEAN DEFAULT TRUE;');
    await pool.query('ALTER TABLE laptops ADD COLUMN IF NOT EXISTS massStorageDisabled BOOLEAN DEFAULT TRUE;');
    console.log("Migration successful!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
