const db = require('../config/database');

/**
 * GET /api/reports/dashboard  [Admin]
 * Statistik dashboard admin - PostgreSQL compatible
 */
const getDashboardStats = async (req, res) => {
  try {
    const [[totalBookings]]   = await db.query('SELECT COUNT(*) AS total FROM bookings');
    const [[pendingBookings]] = await db.query("SELECT COUNT(*) AS total FROM bookings WHERE status_booking = 'pending'");
    const [[confirmedBook]]   = await db.query("SELECT COUNT(*) AS total FROM bookings WHERE status_booking = 'confirmed'");
    const [[bookingRevenue]]  = await db.query(
      "SELECT COALESCE(SUM(b.total_harga), 0) AS total FROM bookings b JOIN payments p ON b.id_booking = p.id_booking WHERE p.status_payment = 'verified'"
    );
    const [[eventRevenue]]    = await db.query(`
      SELECT COALESCE(SUM(
        COALESCE(e.paket_biaya_adjusted, pkg.harga, 0) +
        COALESCE((SELECT SUM(total_harga) FROM event_orders WHERE id_event = e.id_event), 0) +
        COALESCE((SELECT SUM(total_harga) FROM event_rentals WHERE id_event = e.id_event), 0)
      ), 0) AS total
      FROM event_payments ep
      JOIN events e ON ep.id_event = e.id_event
      LEFT JOIN event_packages pkg ON e.id_package = pkg.id_package
      WHERE ep.status_payment = 'verified'
    `);
    const [[totalUsers]]      = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'customer'");
    const [[totalEvents]]     = await db.query('SELECT COUNT(*) AS total FROM events');
    const [[pendingEvents]]   = await db.query("SELECT COUNT(*) AS total FROM events WHERE status_event = 'pending'");
    const [[pendingPayments]] = await db.query(`
      SELECT (
        (SELECT COUNT(*) FROM payments WHERE status_payment = 'pending') +
        (SELECT COUNT(*) FROM event_payments WHERE status_payment = 'pending')
      ) AS total
    `);

    const totalRevenue = Number(bookingRevenue.total || 0) + Number(eventRevenue.total || 0);

    // Booking per bulan (12 bulan terakhir) - PostgreSQL syntax
    const [bookingPerMonth] = await db.query(`
      SELECT TO_CHAR(tanggal, 'YYYY-MM') AS bulan, COUNT(*) AS total
      FROM bookings
      WHERE tanggal >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(tanggal, 'YYYY-MM')
      ORDER BY bulan ASC
    `);

    // Revenue per bulan - PostgreSQL syntax
    const [revenuePerMonth] = await db.query(`
      SELECT TO_CHAR(b.tanggal, 'YYYY-MM') AS bulan, SUM(b.total_harga) AS total
      FROM bookings b
      JOIN payments p ON b.id_booking = p.id_booking
      WHERE p.status_payment = 'verified'
        AND b.tanggal >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(b.tanggal, 'YYYY-MM')
      ORDER BY bulan ASC
    `);

    // Studio terpopuler - PostgreSQL GROUP BY harus include nama_studio
    const [popularStudios] = await db.query(`
      SELECT s.id_studio, s.nama_studio, COUNT(b.id_booking) AS total_booking
      FROM bookings b
      JOIN studios s ON b.id_studio = s.id_studio
      WHERE b.status_booking NOT IN ('rejected','cancelled')
      GROUP BY s.id_studio, s.nama_studio
      ORDER BY total_booking DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        overview: {
          totalBookings:    Number(totalBookings.total),
          pendingBookings:  Number(pendingBookings.total),
          confirmedBookings:Number(confirmedBook.total),
          totalRevenue,
          totalCustomers:   Number(totalUsers.total),
          totalEvents:      Number(totalEvents.total),
          pendingEvents:    Number(pendingEvents.total),
          pendingPayments:  Number(pendingPayments.total),
        },
        bookingPerMonth,
        revenuePerMonth,
        popularStudios,
      },
    });
  } catch (err) {
    console.error('getDashboardStats error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/reports/transactions  [Admin]
 * Laporan transaksi - PostgreSQL compatible
 */
const getTransactionReport = async (req, res) => {
  try {
    const { start_date, end_date, transaction_type, metode } = req.query;

    // Gunakan subquery dengan alias untuk UNION ALL - kompatibel dengan PostgreSQL
    let baseQuery = `
      SELECT b.id_booking, u.nama AS customer, s.nama_studio,
             p.tanggal_payment AS tanggal, b.jam_mulai, b.jam_selesai, b.total_harga,
             b.status_booking, p.metode, p.status_payment, p.tanggal_payment,
             'booking' AS transaction_type,
             CONCAT('BKG-', b.id_booking::text) AS reference_code,
             s.nama_studio AS reference_name
      FROM payments p
      JOIN bookings b ON p.id_booking = b.id_booking
      JOIN users u   ON b.id_user   = u.id_user
      JOIN studios s ON b.id_studio = s.id_studio
      UNION ALL
      SELECT NULL::integer AS id_booking, u.nama AS customer, NULL AS nama_studio,
             ep.tanggal_payment AS tanggal, NULL AS jam_mulai, NULL AS jam_selesai,
             (
               COALESCE(e.paket_biaya_adjusted, pkg.harga, 0) +
               COALESCE((SELECT SUM(total_harga) FROM event_orders WHERE id_event = e.id_event), 0) +
               COALESCE((SELECT SUM(total_harga) FROM event_rentals WHERE id_event = e.id_event), 0)
             ) AS total_harga,
             e.status_event AS status_booking, ep.metode, ep.status_payment, ep.tanggal_payment,
             'event' AS transaction_type,
             CONCAT('EVT-', e.id_event::text) AS reference_code,
             e.nama_event AS reference_name
      FROM event_payments ep
      JOIN events e ON ep.id_event = e.id_event
      JOIN users u ON e.id_user = u.id_user
      LEFT JOIN event_packages pkg ON e.id_package = pkg.id_package
    `;

    let query = `SELECT * FROM (${baseQuery}) trx`;
    const conditions = [];
    const params = [];

    if (start_date && end_date) {
      conditions.push('trx.tanggal BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }
    if (transaction_type && transaction_type !== 'all') {
      conditions.push('trx.transaction_type = ?');
      params.push(transaction_type);
    }
    if (metode && metode !== 'all') {
      conditions.push('trx.metode = ?');
      params.push(metode);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY tanggal DESC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getTransactionReport error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats, getTransactionReport };
