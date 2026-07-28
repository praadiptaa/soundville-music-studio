/**
 * Migration: Tambahkan tanggal_mulai_paket dan tanggal_selesai_paket ke events
 * Tujuan: Memungkinkan menentukan tanggal package-specific (terpisah dari event dates)
 */

const db = require('../config/database');

async function addPackageDatesToEvents() {
  try {
    console.log('⏳ Adding package date fields to events table...');

    // Check if columns already exist
    const [result] = await db.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='events' AND (COLUMN_NAME='tanggal_mulai_paket' OR COLUMN_NAME='tanggal_selesai_paket')"
    );

    if (result.length > 0) {
      console.log('ℹ️  Package date columns already exist');
      process.exit(0);
    }

    // Add columns
    await db.query(`
      ALTER TABLE events 
      ADD COLUMN tanggal_mulai_paket DATE DEFAULT NULL AFTER id_package,
      ADD COLUMN tanggal_selesai_paket DATE DEFAULT NULL AFTER tanggal_mulai_paket
    `);

    console.log('✅ Migration berhasil!');
    console.log('   - Column tanggal_mulai_paket ditambahkan');
    console.log('   - Column tanggal_selesai_paket ditambahkan');
    console.log('   - Kedua field optional (NULL by default)');
    process.exit(0);

  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

addPackageDatesToEvents();
