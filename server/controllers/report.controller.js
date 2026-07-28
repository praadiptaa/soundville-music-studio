const db = require('../config/database');

/**
 * GET /api/reports/dashboard  [Admin]
 * Statistik dashboard admin
 */
/**
 * Ambil statistik dashboard admin
 * 
 * @description
 * Admin dashboard menampilkan ringkasan data bisnis dalam satu view.
 * Menampilkan:
 * - Overview: total bookings, pending, revenue, customers, events
 * - Booking trends (booking per bulan selama 12 bulan terakhir)
 * - Revenue trends (revenue per bulan)
 * - Studio popularity (top 5 studio paling banyak dipesan)
 * Data diambil dari database dengan aggregation query dan summary calculations.
 * 
 * @async
 * @route GET /api/reports/dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @returns {200} Dashboard statistics
 * @returns {Object} { success: true, data: { overview, bookingPerMonth, revenuePerMonth, popularStudios } }
 * 
 * @throws {500} Database query error
 * 
 * @requires admin
 * 
 * @example
 * GET /api/reports/dashboard
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "overview": {
 *       "totalBookings": 45,
 *       "pendingBookings": 8,
 *       "confirmedBookings": 35,
 *       "totalRevenue": 450000000,
 *       "totalCustomers": 38,
 *       "totalEvents": 12,
 *       "pendingEvents": 3,
 *       "pendingPayments": 11
 *     },
 *     "bookingPerMonth": [
 *       { "bulan": "2024-01", "total": 4 },
 *       { "bulan": "2024-02", "total": 6 },
 *       { "bulan": "2024-03", "total": 5 },
 *       ...
 *     ],
 *     "revenuePerMonth": [
 *       { "bulan": "2024-01", "total": 40000000 },
 *       { "bulan": "2024-02", "total": 60000000 },
 *       ...
 *     ],
 *     "popularStudios": [
 *       { "nama_studio": "Studio A", "total_booking": 12 },
 *       { "nama_studio": "Studio B", "total_booking": 10 },
 *       { "nama_studio": "Studio C", "total_booking": 8 },
 *       { "nama_studio": "Studio D", "total_booking": 7 },
 *       { "nama_studio": "Studio E", "total_booking": 5 }
 *     ]
 *   }
 * }
 * 
 * @note
 * - Data 12 bulan terakhir untuk trend analysis
 * - Revenue hanya count dari verified payments
 * - Popular studios exclude rejected/cancelled bookings
 * - Dashboard refresh minimal every 5 minutes (implement caching)
 * 
 * @todo
 * - Implement caching untuk reduce database load
 * - Add more detailed breakdowns (by payment method, by customer segment)
 * - Add comparison with previous period (YoY, MoM)
 * - Implement real-time dashboard update dengan WebSocket
 */
const getDashboardStats = async (req, res) => {
  try {
    const [[totalBookings]]  = await db.query('SELECT COUNT(*) AS total FROM bookings');
    const [[pendingBookings]]= await db.query("SELECT COUNT(*) AS total FROM bookings WHERE status_booking = 'pending'");
    const [[confirmedBook]]  = await db.query("SELECT COUNT(*) AS total FROM bookings WHERE status_booking = 'confirmed'");
    const [[bookingRevenue]] = await db.query("SELECT IFNULL(SUM(b.total_harga), 0) AS total FROM bookings b JOIN payments p ON b.id_booking = p.id_booking WHERE p.status_payment = 'verified'");
    const [[eventRevenue]]   = await db.query(`
      SELECT IFNULL(SUM(
        COALESCE(e.paket_biaya_adjusted, p.harga, 0) +
        COALESCE((SELECT SUM(total_harga) FROM event_orders WHERE id_event = e.id_event), 0) +
        COALESCE((SELECT SUM(total_harga) FROM event_rentals WHERE id_event = e.id_event), 0)
      ), 0) AS total
      FROM event_payments ep
      JOIN events e ON ep.id_event = e.id_event
      LEFT JOIN event_packages p ON e.id_package = p.id_package
      WHERE ep.status_payment = 'verified'
    `);
    const [[totalUsers]]     = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'customer'");
    const [[totalEvents]]    = await db.query('SELECT COUNT(*) AS total FROM events');
    const [[pendingEvents]]  = await db.query("SELECT COUNT(*) AS total FROM events WHERE status_event = 'pending'");
    const [[pendingPayments]]= await db.query("SELECT (SELECT COUNT(*) FROM payments WHERE status_payment = 'pending') + (SELECT COUNT(*) FROM event_payments WHERE status_payment = 'pending') AS total");

    const totalRevenue = Number(bookingRevenue.total || 0) + Number(eventRevenue.total || 0);

    // Booking per bulan (12 bulan terakhir)
    const [bookingPerMonth] = await db.query(`
      SELECT DATE_FORMAT(tanggal, '%Y-%m') AS bulan, COUNT(*) AS total
      FROM bookings
      WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY bulan
      ORDER BY bulan ASC
    `);

    // Revenue per bulan
    const [revenuePerMonth] = await db.query(`
      SELECT DATE_FORMAT(b.tanggal, '%Y-%m') AS bulan, SUM(b.total_harga) AS total
      FROM bookings b
      JOIN payments p ON b.id_booking = p.id_booking
      WHERE p.status_payment = 'verified'
        AND b.tanggal >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY bulan
      ORDER BY bulan ASC
    `);

    // Studio terpopuler
    const [popularStudios] = await db.query(`
      SELECT s.nama_studio, COUNT(b.id_booking) AS total_booking
      FROM bookings b
      JOIN studios s ON b.id_studio = s.id_studio
      WHERE b.status_booking NOT IN ('rejected','cancelled')
      GROUP BY s.id_studio
      ORDER BY total_booking DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        overview: {
          totalBookings:   totalBookings.total,
          pendingBookings: pendingBookings.total,
          confirmedBookings: confirmedBook.total,
          totalRevenue,
          totalCustomers:  totalUsers.total,
          totalEvents:     totalEvents.total,
          pendingEvents:   pendingEvents.total,
          pendingPayments: pendingPayments.total,
        },
        bookingPerMonth,
        revenuePerMonth,
        popularStudios,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/reports/transactions  [Admin]
 * Laporan transaksi
 */
/**
 * Ambil laporan transaksi (booking & event combined)
 * 
 * @description
 * Admin export laporan transaksi lengkap untuk accounting/audit purposes.
 * Menggabungkan booking payments dan event payments dalam satu view untuk kemudahan.
 * Bisa filter berdasarkan tanggal range (start_date sampai end_date).
 * Data di-sort by tanggal DESC (paling baru dulu).
 * 
 * Format data:
 * - Booking transactions: dari tabel bookings JOIN payments
 * - Event transactions: dari tabel events JOIN event_payments dengan aggregation
 * Setiap transaction row include:
 * - Transaction type (booking atau event)
 * - Reference code (BKG-{id} atau EVT-{id})
 * - Customer name, total amount, status
 * - Payment method & verification status
 * 
 * @async
 * @route GET /api/reports/transactions
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.start_date] - Start date (YYYY-MM-DD format, opsional)
 * @param {string} [req.query.end_date] - End date (YYYY-MM-DD format, opsional)
 * @param {Object} res - Express response object
 * 
 * @returns {200} Transaction report
 * @returns {Array<Object>} Array of transaction objects dengan fields:
 *          [
 *            {
 *              id_booking,
 *              customer,
 *              reference_code,
 *              reference_name,
 *              tanggal,
 *              total_harga,
 *              status_booking,
 *              metode,
 *              status_payment,
 *              transaction_type,
 *              tanggal_payment
 *            },
 *            ...
 *          ]
 * 
 * @throws {500} Database query error
 * 
 * @requires admin
 * 
 * @example
 * GET /api/reports/transactions?start_date=2024-06-01&end_date=2024-06-30
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id_booking": 12,
 *       "customer": "Andi Pratama",
 *       "reference_code": "BKG-12",
 *       "reference_name": "Studio A - Recording Session",
 *       "tanggal": "2024-06-20",
 *       "jam_mulai": "09:00",
 *       "jam_selesai": "12:00",
 *       "total_harga": 1500000,
 *       "status_booking": "confirmed",
 *       "metode": "BCA Transfer",
 *       "status_payment": "verified",
 *       "transaction_type": "booking",
 *       "tanggal_payment": "2024-06-19T15:30:00Z"
 *     },
 *     {
 *       "customer": "Budi Santoso",
 *       "reference_code": "EVT-5",
 *       "reference_name": "Pernikahan Budi & Siti",
 *       "tanggal": "2024-06-25",
 *       "total_harga": 75000000,
 *       "status_booking": "confirmed",
 *       "metode": "BNI Transfer",
 *       "status_payment": "verified",
 *       "transaction_type": "event",
 *       "tanggal_payment": "2024-06-22T10:00:00Z"
 *     }
 *   ]
 * }
 * 
 * @example
 * GET /api/reports/transactions (tanpa date filter)
 * // Return semua transactions (besar, untuk first load bisa lambat)
 * 
 * @note
 * - Booking dan event transactions dalam satu unified view untuk reporting convenience
 * - Event payment include aggregation dari package + services + equipment
 * - Sorted by tanggal DESC (paling recent dulu)
 * - Status payment: 'pending', 'verified', 'rejected'
 * - Untuk export to CSV/Excel, implement di frontend
 * 
 * @todo
 * - Implement pagination untuk large datasets
 * - Add more filter options (by payment method, status, customer)
 * - Add export to CSV/PDF functionality
 * - Implement report scheduling (auto-send daily/weekly to admin email)
 * - Add reconciliation report (what's paid vs outstanding)
 */
const getTransactionReport = async (req, res) => {
  try {
    const { start_date, end_date, transaction_type, metode } = req.query;
    let baseQuery = `
      SELECT b.id_booking, u.nama AS customer, s.nama_studio,
             p.tanggal_payment AS tanggal, b.jam_mulai, b.jam_selesai, b.total_harga,
             b.status_booking, p.metode, p.status_payment, p.tanggal_payment,
             'booking' AS transaction_type,
             CONCAT('BKG-', b.id_booking) AS reference_code,
             s.nama_studio AS reference_name
      FROM payments p
      JOIN bookings b ON p.id_booking = b.id_booking
      JOIN users u   ON b.id_user   = u.id_user
      JOIN studios s ON b.id_studio = s.id_studio
      UNION ALL
      SELECT NULL AS id_booking, u.nama AS customer, NULL AS nama_studio,
             ep.tanggal_payment AS tanggal, NULL AS jam_mulai, NULL AS jam_selesai,
             (
               COALESCE(e.paket_biaya_adjusted, pkg.harga, 0) +
               COALESCE((SELECT SUM(total_harga) FROM event_orders WHERE id_event = e.id_event), 0) +
               COALESCE((SELECT SUM(total_harga) FROM event_rentals WHERE id_event = e.id_event), 0)
             ) AS total_harga,
             e.status_event AS status_booking, ep.metode, ep.status_payment, ep.tanggal_payment,
             'event' AS transaction_type,
             CONCAT('EVT-', e.id_event) AS reference_code,
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
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats, getTransactionReport };
