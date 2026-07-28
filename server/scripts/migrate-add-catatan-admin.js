/**
 * Migration script untuk menambahkan kolom catatan_admin ke tabel bookings
 * Usage: node scripts/migrate-add-catatan-admin.js
 */

const db = require('../config/database');

async function migrate() {
  try {
    console.log('🔄 Menambahkan kolom catatan_admin ke tabel bookings...');
    
    // Cek apakah kolom sudah ada
    const [columns] = await db.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='bookings' AND COLUMN_NAME='catatan_admin'"
    );
    
    if (columns.length > 0) {
      console.log('✅ Kolom catatan_admin sudah ada, tidak perlu migrasi');
      process.exit(0);
    }
    
    // Tambah kolom
    await db.query(
      "ALTER TABLE bookings ADD COLUMN catatan_admin TEXT DEFAULT NULL"
    );
    
    console.log('✅ Kolom catatan_admin berhasil ditambahkan!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

migrate();
