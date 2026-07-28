const { Pool } = require('pg');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  console.log('🔍 Testing fixed getTransactionReport query...');

  const baseQuery = `
    SELECT b.id_booking, u.nama AS customer, s.nama_studio,
           COALESCE(p.tanggal_payment, b.tanggal::timestamp, b.created_at) AS tanggal,
           b.jam_mulai, b.jam_selesai, b.total_harga,
           b.status_booking::text AS status_booking, p.metode, p.status_payment::text AS status_payment, p.tanggal_payment,
           'booking' AS transaction_type,
           CONCAT('BKG-', b.id_booking::text) AS reference_code,
           s.nama_studio AS reference_name
    FROM bookings b
    JOIN users u   ON b.id_user   = u.id_user
    JOIN studios s ON b.id_studio = s.id_studio
    LEFT JOIN payments p ON b.id_booking = p.id_booking
    UNION ALL
    SELECT NULL::integer AS id_booking, u.nama AS customer, NULL AS nama_studio,
           COALESCE(ep.tanggal_payment, e.tanggal_event::timestamp, e.created_at) AS tanggal,
           NULL AS jam_mulai, NULL AS jam_selesai,
           (
             COALESCE(e.paket_biaya_adjusted, pkg.harga, 0) +
             COALESCE((SELECT SUM(total_harga) FROM event_orders WHERE id_event = e.id_event), 0) +
             COALESCE((SELECT SUM(total_harga) FROM event_rentals WHERE id_event = e.id_event), 0)
           ) AS total_harga,
           e.status_event::text AS status_booking, ep.metode, ep.status_payment::text AS status_payment, ep.tanggal_payment,
           'event' AS transaction_type,
           CONCAT('EVT-', e.id_event::text) AS reference_code,
           e.nama_event AS reference_name
    FROM events e
    JOIN users u ON e.id_user = u.id_user
    LEFT JOIN event_packages pkg ON e.id_package = pkg.id_package
    LEFT JOIN event_payments ep ON e.id_event = ep.id_event
  `;

  const query = `SELECT * FROM (${baseQuery}) trx ORDER BY tanggal DESC`;

  const res = await client.query(query);
  console.log(`\n🎉 SUCCESS! Query returned ${res.rows.length} transactions:`);
  res.rows.forEach(r => {
    console.log(`  - [${r.reference_code}] Customer: ${r.customer}, Reference: ${r.reference_name}, Total: Rp ${r.total_harga}, Status Order: ${r.status_booking}, Status Bayar: ${r.status_payment || 'Belum Bayar'}`);
  });

  client.release();
  process.exit(0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
