const { Pool } = require('pg');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  console.log('🔍 Checking bookings...');
  const resB = await client.query('SELECT b.*, u.nama as customer_name, s.nama_studio FROM bookings b JOIN users u ON b.id_user = u.id_user JOIN studios s ON b.id_studio = s.id_studio');
  console.log('Bookings count:', resB.rows.length);
  resB.rows.forEach(r => console.log(`  Booking #${r.id_booking}: customer=${r.customer_name}, studio=${r.nama_studio}, date=${r.tanggal}, status=${r.status_booking}`));

  console.log('\n🔍 Checking payments...');
  const resP = await client.query('SELECT * FROM payments');
  console.log('Payments count:', resP.rows.length);
  resP.rows.forEach(r => console.log(`  Payment #${r.id_payment}: id_booking=${r.id_booking}, status=${r.status_payment}, tanggal_payment=${r.tanggal_payment}`));

  console.log('\n🔍 Checking events...');
  const resE = await client.query('SELECT * FROM events');
  console.log('Events count:', resE.rows.length);

  console.log('\n🔍 Testing getTransactionReport base query...');
  const resReport = await client.query(`
    SELECT b.id_booking, u.nama AS customer, s.nama_studio,
           COALESCE(p.tanggal_payment, b.tanggal::timestamp, b.created_at) AS tanggal,
           b.jam_mulai, b.jam_selesai, b.total_harga,
           b.status_booking, p.metode, p.status_payment, p.tanggal_payment,
           'booking' AS transaction_type,
           CONCAT('BKG-', b.id_booking::text) AS reference_code,
           s.nama_studio AS reference_name
    FROM bookings b
    JOIN users u   ON b.id_user   = u.id_user
    JOIN studios s ON b.id_studio = s.id_studio
    LEFT JOIN payments p ON b.id_booking = p.id_booking
  `);
  console.log('Report rows with LEFT JOIN:', resReport.rows.length);
  resReport.rows.forEach(r => console.log('  Row:', r));

  client.release();
  process.exit(0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
