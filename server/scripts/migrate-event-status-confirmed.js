/**
 * Migration: Tambahkan 'confirmed' status ke events table
 * Tujuan: Menyamakan event status dengan booking status
 * untuk konsistensi payment verification flow
 */

const db = require('../config/database');

async function migrateEventStatus() {
  try {
    console.log('⏳ Migrating event status_event enum...');

    // Alternatif 1: Modify column untuk add 'confirmed' sebelum 'completed'
    await db.query(`
      ALTER TABLE events 
      MODIFY COLUMN status_event 
      ENUM('pending','approved','rejected','confirmed','completed','cancelled') 
      NOT NULL DEFAULT 'pending'
    `);

    console.log('✅ Event status migration berhasil!');
    console.log('   Status yang tersedia sekarang: pending, approved, rejected, confirmed, completed, cancelled');
    process.exit(0);

  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

migrateEventStatus();
