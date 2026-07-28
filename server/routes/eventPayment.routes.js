/**
 * @module routes/eventPayment
 * @description Route definitions untuk event payment management (upload bukti, verifikasi)
 * @requires controllers/eventPayment.controller
 * @requires middleware/auth.middleware
 * @requires middleware/upload.middleware
 */
const router = require('express').Router(); // Express router
const { // Import event payment controller functions
  uploadEventPayment,
  getAllEventPayments,
  getEventPaymentById,
  getPaymentByEventId,
  verifyEventPayment,
  updateEventPaymentStatus,
} = require('../controllers/eventPayment.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware'); // Import auth middleware
const upload = require('../middleware/upload.middleware'); // Import file upload middleware

/**
 * @route POST /api/event-payments
 * @description Customer upload bukti pembayaran DP event (50% dari total)
 * @access Customer
 * @requires token
 * @body {number} id_event - ID Event
 * @body {file} bukti_transfer - Image file bukti transfer
 * @returns {201} Bukti pembayaran DP berhasil di-upload
 */
router.post('/', verifyToken, upload.single('bukti_transfer'), uploadEventPayment);

/**
 * @route GET /api/event-payments
 * @description Admin mengambil seluruh data transaksi pembayaran event
 * @access Admin only
 * @requires token
 * @returns {200} List pembayaran event
 */
router.get('/', verifyToken, isAdmin, getAllEventPayments);

/**
 * @route GET /api/event-payments/event/:id_event
 * @description Ambil payment berdasarkan ID Event (admin & customer pemilik)
 * @access Customer (milik sendiri) / Admin
 * @requires token
 * @param {number} id_event - ID Event
 * @returns {200} Detail pembayaran DP atau 404 jika belum ada
 */
router.get('/event/:id_event', verifyToken, getPaymentByEventId);

/**
 * @route GET /api/event-payments/:id
 * @description Mengambil detail pembayaran event berdasarkan ID Payment
 * @access Customer (milik sendiri) / Admin
 * @requires token
 * @param {number} id - ID Event Payment
 * @returns {200} Detail pembayaran event
 */
router.get('/:id', verifyToken, getEventPaymentById);

/**
 * @route PUT /api/event-payments/verify/:id
 * @description Admin memverifikasi pembayaran event (approve/reject)
 * @access Admin only
 * @requires token
 * @param {number} id - ID Event Payment
 * @body {string} status_payment - Status baru ('verified', 'rejected')
 * @returns {200} Pembayaran berhasil diverifikasi
 */
router.put('/verify/:id', verifyToken, isAdmin, verifyEventPayment);

/**
 * @route PUT /api/event-payments/event/:id/payment
 * @description Admin menandai event sebagai lunas secara manual (Cash/QRIS)
 * @access Admin only
 * @requires token
 */
router.put('/event/:id/payment', verifyToken, isAdmin, updateEventPaymentStatus);

module.exports = router; // Export router