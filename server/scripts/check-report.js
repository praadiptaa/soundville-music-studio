const db = require('../config/database');

async function check() {
  try {
    const query = `
      SELECT b.id_booking, u.nama AS customer, s.nama_studio,
             b.tanggal, b.jam_mulai, b.jam_selesai, b.total_harga,
             b.status_booking, p.metode, p.status_payment, p.tanggal_payment,
             'booking' AS transaction_type,
             CONCAT('BKG-', b.id_booking) AS reference_code,
             s.nama_studio AS reference_name
      FROM bookings b
      JOIN users u   ON b.id_user   = u.id_user
      JOIN studios s ON b.id_studio = s.id_studio
      LEFT JOIN payments p ON b.id_booking = p.id_booking
      UNION ALL
      SELECT NULL AS id_booking, u.nama AS customer, NULL AS nama_studio,
             e.tanggal_event AS tanggal, NULL AS jam_mulai, NULL AS jam_selesai,
             COALESCE(pkg.harga, 0) + COALESCE(ord.total_order, 0) AS total_harga,
             e.status_event AS status_booking, ep.metode, ep.status_payment, ep.tanggal_payment,
             'event' AS transaction_type,
             CONCAT('EVT-', e.id_event) AS reference_code,
             e.nama_event AS reference_name
      FROM events e
      JOIN users u ON e.id_user = u.id_user
      LEFT JOIN event_packages pkg ON e.id_package = pkg.id_package
      LEFT JOIN (
        SELECT id_event, SUM(total_harga) AS total_order
        FROM event_orders
        GROUP BY id_event
      ) ord ON e.id_event = ord.id_event
      LEFT JOIN event_payments ep ON e.id_event = ep.id_event
      ORDER BY tanggal DESC
    `;
    const [rows] = await db.query(query);
    console.log(rows.filter(r => r.customer === 'coba'));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();
