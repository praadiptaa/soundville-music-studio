#!/usr/bin/env node

/**
 * Script untuk fix booking dates yang offset
 * Hapus semua booking dan payment yang mungkin punya tanggal salah
 */

const db = require('../config/database');

async function fixBookingDates() {
  try {
    console.log('🔧 Membersihkan booking lama...\n');

    // Delete semua payments dulu (foreign key constraint)
    const [deletePayments] = await db.query('DELETE FROM payments');
    console.log(`✓ Deleted ${deletePayments.affectedRows} payment records`);

    // Delete semua bookings
    const [deleteBookings] = await db.query('DELETE FROM bookings');
    console.log(`✓ Deleted ${deleteBookings.affectedRows} booking records`);

    // Verify
    const [count] = await db.query('SELECT COUNT(*) as total FROM bookings');
    console.log(`\n✅ Done! Total bookings sekarang: ${count[0].total}`);
    console.log('\n📝 Silakan membuat booking baru - data lama sudah dibersihkan');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixBookingDates();
