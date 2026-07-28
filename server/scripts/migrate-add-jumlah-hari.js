/**
 * Migration: Tambahkan field jumlah_hari ke tabel events
 * Tujuan: Memungkinkan customer memilih durasi event
 */

const db = require('../config/database');

async function addJumlahHariToEvents() {
  try {
    console.log('⏳ Adding jumlah_hari column to events table...');

    // Check if column already exists
    const [result] = await db.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='events' AND COLUMN_NAME='jumlah_hari'"
    );

    if (result.length > 0) {
      console.log('ℹ️  Column jumlah_hari already exists');
      process.exit(0);
    }

    // Add column
    await db.query(`
      ALTER TABLE events 
      ADD COLUMN jumlah_hari INT DEFAULT 1 AFTER tanggal_event
    `);

    console.log('✅ Migration berhasil! Column jumlah_hari ditambahkan.');
    console.log('   - Type: INT');
    console.log('   - Default: 1 hari');
    console.log('   - Position: Setelah tanggal_event');
    process.exit(0);

  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

addJumlahHariToEvents();
