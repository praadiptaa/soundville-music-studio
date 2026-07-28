const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  const results = [];

  const test = async (name, sql, params = []) => {
    try {
      // Convert ? to $N
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      await client.query(pgSql, params);
      results.push({ name, status: '✅ OK' });
    } catch (err) {
      results.push({ name, status: `❌ FAIL: ${err.message}` });
    }
  };

  // === BOOKING MODEL TESTS ===
  await test('booking.isScheduleAvailable',
    `SELECT COUNT(*) AS total FROM bookings b LEFT JOIN payments p ON b.id_booking = p.id_booking WHERE b.id_studio = ? AND b.tanggal::date = ?::date AND b.status_booking NOT IN ('rejected', 'cancelled') AND (p.status_payment IS NULL OR p.status_payment != 'rejected') AND (b.jam_mulai < ? AND b.jam_selesai > ?)`,
    [1, '2026-07-28', '10:00', '09:00']
  );
  await test('booking.getScheduleByDate',
    `SELECT TO_CHAR(b.tanggal, 'YYYY-MM-DD') AS tanggal_formatted FROM bookings b JOIN users u ON b.id_user = u.id_user LEFT JOIN payments p ON b.id_booking = p.id_booking WHERE b.id_studio = ? AND b.tanggal::date = ?::date LIMIT 5`,
    [1, '2026-07-28']
  );
  await test('booking.getScheduleByMonth',
    `SELECT TO_CHAR(b.tanggal, 'YYYY-MM-DD') as tanggal, b.jam_mulai, b.jam_selesai, b.status_booking FROM bookings b LEFT JOIN payments p ON b.id_booking = p.id_booking WHERE b.id_studio = ? AND EXTRACT(YEAR FROM b.tanggal) = ? AND EXTRACT(MONTH FROM b.tanggal) = ? LIMIT 5`,
    [1, 2026, 7]
  );
  await test('booking.findAll',
    `SELECT b.*, TO_CHAR(b.tanggal, 'YYYY-MM-DD') AS tanggal_str FROM bookings b JOIN users u ON b.id_user = u.id_user JOIN studios s ON b.id_studio = s.id_studio LEFT JOIN payments p ON b.id_booking = p.id_booking ORDER BY b.created_at DESC LIMIT 5`
  );

  // === EVENT MODEL TESTS ===
  await test('event.findAll (STRING_AGG)',
    `SELECT e.id_event, u.nama AS nama_customer, ep.nama_paket, STRING_AGG(es.nama_service, ', ' ORDER BY es.nama_service) AS services
     FROM events e JOIN users u ON e.id_user = u.id_user LEFT JOIN event_packages ep ON e.id_package = ep.id_package
     LEFT JOIN event_payments pay ON e.id_event = pay.id_event LEFT JOIN event_orders eo ON e.id_event = eo.id_event
     LEFT JOIN event_services es ON eo.id_service = es.id_service
     GROUP BY e.id_event, u.nama, ep.nama_paket, pay.status_payment, pay.tipe_pembayaran, pay.metode
     ORDER BY e.created_at DESC LIMIT 5`
  );

  // === REPORT CONTROLLER TESTS ===
  await test('report.bookingPerMonth (TO_CHAR + INTERVAL)',
    `SELECT TO_CHAR(tanggal, 'YYYY-MM') AS bulan, COUNT(*) AS total FROM bookings WHERE tanggal >= CURRENT_DATE - INTERVAL '12 months' GROUP BY TO_CHAR(tanggal, 'YYYY-MM') ORDER BY bulan ASC`
  );
  await test('report.revenuePerMonth',
    `SELECT TO_CHAR(b.tanggal, 'YYYY-MM') AS bulan, SUM(b.total_harga) AS total FROM bookings b JOIN payments p ON b.id_booking = p.id_booking WHERE p.status_payment = 'verified' AND b.tanggal >= CURRENT_DATE - INTERVAL '12 months' GROUP BY TO_CHAR(b.tanggal, 'YYYY-MM') ORDER BY bulan ASC`
  );
  await test('report.popularStudios',
    `SELECT s.id_studio, s.nama_studio, COUNT(b.id_booking) AS total_booking FROM bookings b JOIN studios s ON b.id_studio = s.id_studio WHERE b.status_booking NOT IN ('rejected','cancelled') GROUP BY s.id_studio, s.nama_studio ORDER BY total_booking DESC LIMIT 5`
  );
  await test('report.dashboard COALESCE (no IFNULL)',
    `SELECT COALESCE(SUM(b.total_harga), 0) AS total FROM bookings b JOIN payments p ON b.id_booking = p.id_booking WHERE p.status_payment = 'verified'`
  );
  await test('report.transactionUnion CONCAT',
    `SELECT CONCAT('BKG-', b.id_booking::text) AS reference_code FROM bookings b LIMIT 1`
  );

  client.release();
  console.log('\n========== TEST RESULTS ==========');
  results.forEach(r => console.log(`${r.status}  ${r.name}`));
  const failed = results.filter(r => r.status.startsWith('❌'));
  console.log(`\nTotal: ${results.length} tests, Failed: ${failed.length}`);
  process.exit(failed.length > 0 ? 1 : 0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
