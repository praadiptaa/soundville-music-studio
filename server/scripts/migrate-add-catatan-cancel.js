/**
 * Migration script untuk menambahkan kolom catatan_cancel ke tabel bookings
 * Usage: node scripts/migrate-add-catatan-cancel.js
 */

const db = require('../config/database');

async function migrate() {
  try {
    console.log('🔄 Menambahkan kolom catatan_cancel ke tabel bookings dan events...');
    
    // Cek dan tambah kolom bookings
    const [bookingColumns] = await db.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='bookings' AND COLUMN_NAME='catatan_cancel'"
    );
    
    if (bookingColumns.length === 0) {
      await db.query("ALTER TABLE bookings ADD COLUMN catatan_cancel TEXT DEFAULT NULL");
      console.log('✅ Kolom catatan_cancel berhasil ditambahkan ke tabel bookings');
    } else {
      console.log('ℹ️ Kolom catatan_cancel sudah ada di tabel bookings');
    }

    // Cek dan tambah kolom events
    const [eventColumns] = await db.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='events' AND COLUMN_NAME='catatan_cancel'"
    );
    
    if (eventColumns.length === 0) {
      await db.query("ALTER TABLE events ADD COLUMN catatan_cancel TEXT DEFAULT NULL");
      console.log('✅ Kolom catatan_cancel berhasil ditambahkan ke tabel events');
    } else {
      console.log('ℹ️ Kolom catatan_cancel sudah ada di tabel events');
    }

    // Update ENUM untuk events jika belum ada 'cancelled'
    try {
      await db.query(
        "ALTER TABLE events MODIFY COLUMN status_event ENUM('pending','approved','rejected','completed','cancelled') NOT NULL DEFAULT 'pending'"
      );
      console.log('✅ ENUM status_event berhasil diupdate dengan status cancelled');
    } catch (e) {
      // Jika sudah ada, skip
      console.log('ℹ️ ENUM status_event sudah memiliki status cancelled');
    }

    console.log('✅ Semua migrasi berhasil!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

migrate();
