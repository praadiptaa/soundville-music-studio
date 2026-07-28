/**
 * @module routes/event
 * @description Route definitions untuk event request management (CRUD, status update, cancel)
 * @requires controllers/event.controller
 * @requires middleware/auth.middleware
 */
const router = require('express').Router(); // Express router
const { createEvent, getAllEvents, getMyEvents, getEventById, updateEventStatus, cancelEvent } = require('../controllers/event.controller'); // Import event controller functions
const { verifyToken, isAdmin } = require('../middleware/auth.middleware'); // Import auth middleware

/**
 * @route POST /api/events
 * @description Customer membuat event request baru (bulk insert service & equipment rentals)
 * @access Customer
 * @requires token
 * @body {string} nama_event - Nama event
 * @body {string} tanggal_event - Tanggal mulai event (YYYY-MM-DD)
 * @body {string} [tanggal_selesai] - Tanggal selesai event (YYYY-MM-DD)
 * @body {number} [id_package] - ID paket event
 * @body {string} [tanggal_mulai_paket] - Tanggal mulai pemakaian paket
 * @body {string} [tanggal_selesai_paket] - Tanggal selesai pemakaian paket
 * @body {string} [lokasi_event] - Lokasi venue
 * @body {string} [deskripsi] - Keterangan/deskripsi event
 * @body {Array<Object>} [orders] - List service order [{ id_service, qty }]
 * @body {Array<Object>} [rentals] - List equipment rental [{ id_equipment, qty }]
 * @returns {201} Event request berhasil dibuat
 */
router.post('/',    verifyToken, createEvent);

/**
 * @route GET /api/events/my
 * @description Customer mengambil list event miliknya sendiri
 * @access Customer
 * @requires token
 * @returns {200} List event milik customer
 */
router.get('/my',   verifyToken, getMyEvents);

/**
 * @route GET /api/events
 * @description Admin mengambil seluruh data event request
 * @access Admin only
 * @requires token
 * @returns {200} List semua event request
 */
router.get('/',     verifyToken, isAdmin, getAllEvents);

/**
 * @route GET /api/events/:id
 * @description Mengambil detail event beserta detail services dan equipment rentals
 * @access Customer (milik sendiri) / Admin
 * @requires token
 * @param {number} id - ID Event
 * @returns {200} Detail event lengkap
 */
router.get('/:id',  verifyToken, getEventById);

/**
 * @route PUT /api/events/:id/cancel
 * @description Customer membatalkan event request
 * @access Customer
 * @requires token
 * @param {number} id - ID Event
 * @returns {200} Event request berhasil dibatalkan
 */
router.put('/:id/cancel', verifyToken, cancelEvent);

/**
 * @route PUT /api/events/:id
 * @description Admin memperbarui status event request (approved/rejected/cancelled/completed)
 * @access Admin only
 * @requires token
 * @param {number} id - ID Event
 * @body {string} status - Status baru ('approved', 'rejected', 'cancelled', 'completed')
 * @returns {200} Status event berhasil diperbarui
 */
router.put('/:id',  verifyToken, isAdmin, updateEventStatus);

module.exports = router; // Export router
