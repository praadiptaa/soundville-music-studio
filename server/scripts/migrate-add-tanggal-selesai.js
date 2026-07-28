/**
 * Migration: Tambahkan field tanggal_selesai ke tabel events
 * Tujuan: Mengganti sistem "jumlah_hari" dengan range tanggal (mulai - selesai)
 */

const db = require('../config/database');

async function addTanggalSelesaiToEvents() {
  try {
    console.log('⏳ Adding tanggal_selesai column to events table...');

    // Check if column already exists
    const [result] = await db.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='events' AND COLUMN_NAME='tanggal_selesai'"
    );

    if (result.length > 0) {
      console.log('ℹ️  Column tanggal_selesai already exists');
      process.exit(0);
    }

    // Add column
    await db.query(`
      ALTER TABLE events 
      ADD COLUMN tanggal_selesai DATE DEFAULT NULL AFTER tanggal_event
    `);

    console.log('✅ Migration berhasil!');
    console.log('   - Column tanggal_selesai ditambahkan');
    console.log('   - Type: DATE');
    console.log('   - Default: NULL');
    console.log('   - Position: Setelah tanggal_event');
    process.exit(0);

  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

addTanggalSelesaiToEvents();
