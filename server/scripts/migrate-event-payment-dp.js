/**
 * Migration: Tambahkan kolom jumlah_bayar dan tipe_pembayaran ke event_payments
 * Tujuan: Mendukung pembayaran DP (down payment) 50% dari total event
 */
const db = require('../config/database');

async function migrate() {
  try {
    console.log('⏳ Menambahkan kolom jumlah_bayar dan tipe_pembayaran ke event_payments...');

    // Tambah kolom jumlah_bayar (nominal yang dibayar)
    await db.query(`
      ALTER TABLE event_payments
      ADD COLUMN IF NOT EXISTS jumlah_bayar DECIMAL(12,2) DEFAULT NULL
      AFTER metode
    `).catch(() => {
      // Kolom mungkin sudah ada (MySQL versi lama tidak support IF NOT EXISTS untuk kolom)
      return db.query(`
        ALTER TABLE event_payments ADD COLUMN jumlah_bayar DECIMAL(12,2) DEFAULT NULL AFTER metode
      `).catch(() => console.log('   ℹ️ Kolom jumlah_bayar mungkin sudah ada, dilewati.'));
    });

    // Tambah kolom tipe_pembayaran (dp / full_payment)
    await db.query(`
      ALTER TABLE event_payments
      ADD COLUMN IF NOT EXISTS tipe_pembayaran ENUM('dp','full_payment') NOT NULL DEFAULT 'dp'
      AFTER jumlah_bayar
    `).catch(() => {
      return db.query(`
        ALTER TABLE event_payments ADD COLUMN tipe_pembayaran ENUM('dp','full_payment') NOT NULL DEFAULT 'dp' AFTER jumlah_bayar
      `).catch(() => console.log('   ℹ️ Kolom tipe_pembayaran mungkin sudah ada, dilewati.'));
    });

    console.log('✅ Migration event_payments berhasil!');
    console.log('   Kolom baru: jumlah_bayar, tipe_pembayaran');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
