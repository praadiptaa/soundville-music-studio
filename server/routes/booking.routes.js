/**
 * @module routes/booking
 * @description Route definitions untuk booking studio (CRUD, jadwal, pembayaran)
 * @requires controllers/booking.controller
 * @requires middleware/auth.middleware
 */
const router = require('express').Router(); // Express router
const { // Import booking controller functions
  createBooking, getAllBookings, getMyBookings,
  getBookingsByUser, getBookingById, updateBookingStatus, cancelBooking,
  getSchedule, getScheduleByMonth, updatePaymentStatus,
} = require('../controllers/booking.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware'); // Import auth middleware

// --- PUBLIC ROUTES (Tidak perlu login) ---
/**
 * @route GET /api/bookings/schedule
 * @description Ambil jadwal booking studio pada tanggal tertentu
 * @access Public
 * @query {number} id_studio - ID studio
 * @query {string} tanggal - Tanggal booking (YYYY-MM-DD)
 * @returns {200} List jadwal booking
 */
router.get('/schedule',       getSchedule);

/**
 * @route GET /api/bookings/schedule/month
 * @description Ambil jadwal booking studio dalam rentang satu bulan
 * @access Public
 * @query {number} id_studio - ID studio
 * @query {number} year - Tahun (YYYY)
 * @query {number} month - Bulan (1-12)
 * @returns {200} List jadwal booking dalam bulan tersebut
 */
router.get('/schedule/month', getScheduleByMonth);

// --- CUSTOMER ROUTES (Memerlukan login) ---
/**
 * @route POST /api/bookings
 * @description Customer membuat booking studio baru
 * @access Customer
 * @requires token
 * @body {number} id_studio - ID studio
 * @body {string} tanggal - Tanggal booking (YYYY-MM-DD)
 * @body {string} jam_mulai - Jam mulai (HH:mm)
 * @body {string} jam_selesai - Jam selesai (HH:mm)
 * @body {string} [catatan] - Catatan tambahan
 * @returns {201} Booking berhasil dibuat
 */
router.post('/',    verifyToken, createBooking);

/**
 * @route GET /api/bookings/my
 * @description Customer mengambil semua booking miliknya sendiri
 * @access Customer
 * @requires token
 * @returns {200} List booking milik customer
 */
router.get('/my',   verifyToken, getMyBookings);

/**
 * @route PUT /api/bookings/:id/cancel
 * @description Customer membatalkan booking (hanya jika status masih pending/unpaid)
 * @access Customer
 * @requires token
 * @param {number} id - ID Booking
 * @returns {200} Booking berhasil dibatalkan
 */
router.put('/:id/cancel', verifyToken, cancelBooking);

// --- ADMIN ROUTES (Admin only) ---
/**
 * @route GET /api/bookings
 * @description Admin mengambil seluruh data booking dari semua customer
 * @access Admin only
 * @requires token
 * @returns {200} List seluruh booking
 */
router.get('/',             verifyToken, isAdmin, getAllBookings);

/**
 * @route GET /api/bookings/user/:id
 * @description Admin mengambil data booking milik user tertentu
 * @access Admin only
 * @requires token
 * @param {number} id - ID User
 * @returns {200} List booking milik user tersebut
 */
router.get('/user/:id',     verifyToken, isAdmin, getBookingsByUser);

/**
 * @route PUT /api/bookings/:id/payment
 * @description Admin memperbarui status pembayaran booking (verifikasi bukti transfer)
 * @access Admin only
 * @requires token
 * @param {number} id - ID Booking
 * @body {string} status_pembayaran - Status baru ('paid', 'unpaid')
 * @returns {200} Status pembayaran berhasil di-update
 */
router.put('/:id/payment',  verifyToken, isAdmin, updatePaymentStatus);

/**
 * @route PUT /api/bookings/:id
 * @description Admin memperbarui status booking (approve/reject/cancel)
 * @access Admin only
 * @requires token
 * @param {number} id - ID Booking
 * @body {string} status_booking - Status baru ('approved', 'rejected', 'cancelled', 'completed')
 * @returns {200} Status booking berhasil di-update
 */
router.put('/:id',          verifyToken, isAdmin, updateBookingStatus);

// --- SHARED ROUTES ---
/**
 * @route GET /api/bookings/:id
 * @description Mengambil detail booking berdasarkan ID
 * @access Customer (hanya milik sendiri) / Admin (semua booking)
 * @requires token
 * @param {number} id - ID Booking
 * @returns {200} Detail booking
 */
router.get('/:id',  verifyToken, getBookingById);

module.exports = router; // Export router
