/**
 * @module routes/payment
 * @description Route definitions untuk studio booking payment management (upload bukti, verifikasi)
 * @requires controllers/payment.controller
 * @requires middleware/auth.middleware
 * @requires middleware/upload.middleware
 */
const router = require('express').Router(); // Express router
const { uploadPayment, getAllPayments, getPaymentById, getPaymentByBookingId, verifyPayment } = require('../controllers/payment.controller'); // Import payment controller functions
const { verifyToken, isAdmin } = require('../middleware/auth.middleware'); // Import auth middleware
const upload = require('../middleware/upload.middleware'); // Import file upload middleware

/**
 * @route POST /api/payments
 * @description Customer upload bukti pembayaran untuk booking studio
 * @access Customer
 * @requires token
 * @body {number} id_booking - ID Booking yang dibayar
 * @body {number} jumlah_bayar - Nominal yang ditransfer
 * @body {file} bukti_transfer - Image file bukti transfer bank
 * @returns {201} Bukti pembayaran berhasil di-upload
 */
router.post('/',               verifyToken, upload.single('bukti_transfer'), uploadPayment);

/**
 * @route GET /api/payments
 * @description Admin mengambil seluruh transaksi pembayaran booking studio
 * @access Admin only
 * @requires token
 * @returns {200} List pembayaran booking studio
 */
router.get('/',                verifyToken, isAdmin, getAllPayments);

/**
 * @route GET /api/payments/booking/:id_booking
 * @description Customer mengambil data pembayaran berdasarkan ID booking
 * @access Customer / Admin
 * @requires token
 * @param {number} id_booking - ID Booking
 * @returns {200} Detail payment atau 404 jika belum ada
 */
router.get('/booking/:id_booking', verifyToken, getPaymentByBookingId);

/**
 * @route GET /api/payments/:id
 * @description Mengambil detail pembayaran booking studio berdasarkan ID
 * @access Customer (milik sendiri) / Admin
 * @requires token
 * @param {number} id - ID Payment
 * @returns {200} Detail transaksi pembayaran
 */
router.get('/:id',             verifyToken, getPaymentById);

/**
 * @route PUT /api/payments/verify/:id
 * @description Admin memverifikasi bukti pembayaran booking studio (approve/reject)
 * @access Admin only
 * @requires token
 * @param {number} id - ID Payment
 * @body {string} status_pembayaran - Status baru ('paid', 'rejected')
 * @returns {200} Pembayaran berhasil diverifikasi
 */
router.put('/verify/:id',      verifyToken, isAdmin, verifyPayment);

module.exports = router; // Export router
