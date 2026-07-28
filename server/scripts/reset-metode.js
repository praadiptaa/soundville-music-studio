/**
 * Script untuk reset metode pembayaran booking tertentu untuk testing
 * Usage: node reset-metode.js <id_booking>
 * Contoh: node reset-metode.js 18
 */

const db = require('../config/database');

const resetMetode = async () => {
  try {
    const id_booking = process.argv[2];
    
    if (!id_booking) {
      console.error('❌ ID Booking harus diberikan');
      console.log('Usage: node reset-metode.js <id_booking>');
      process.exit(1);
    }

    // Check booking exists
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id_booking = ?', [id_booking]);
    if (!bookings.length) {
      console.error(`❌ Booking ${id_booking} tidak ditemukan`);
      process.exit(1);
    }

    const booking = bookings[0];
    console.log(`\n📋 Booking ${id_booking}:`);
    console.log(`   Status: ${booking.status_booking}`);
    console.log(`   Total: Rp ${booking.total_harga}`);

    // Check payment exists
    const [payments] = await db.query('SELECT * FROM payments WHERE id_booking = ?', [id_booking]);
    
    if (!payments.length) {
      console.log('   ⚠️  Belum ada record pembayaran');
      process.exit(1);
    }

    const payment = payments[0];
    console.log(`   Status Bayar: ${payment.status_payment}`);
    console.log(`   Metode Saat Ini: ${payment.metode || 'kosong'}\n`);

    // Reset metode ke NULL
    await db.query('UPDATE payments SET metode = NULL WHERE id_booking = ?', [id_booking]);
    
    console.log(`✅ Metode pembayaran booking ${id_booking} berhasil di-reset`);
    console.log(`   Sekarang admin bisa klik tombol "Lunas" untuk memilih metode pembayaran\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

resetMetode();
