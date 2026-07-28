/**
 * @module routes/eventService
 * @description Route definitions untuk event service management (CRUD)
 * @requires controllers/eventService.controller
 * @requires middleware/auth.middleware
 */
const router = require('express').Router(); // Express router
const { getAllServices, getServiceById, createService, updateService, deleteService } = require('../controllers/eventService.controller'); // Import service controller functions
const { verifyToken, isAdmin } = require('../middleware/auth.middleware'); // Import auth middleware

// --- PUBLIC ROUTES (Tidak perlu login) ---
/**
 * @route GET /api/event-services
 * @description Ambil semua jenis event services aktif
 * @access Public
 * @returns {200} List event services aktif
 */
router.get('/',     getAllServices);

/**
 * @route GET /api/event-services/:id
 * @description Ambil detail event service berdasarkan ID
 * @access Public
 * @param {number} id - ID Service
 * @returns {200} Detail event service
 */
router.get('/:id',  getServiceById);

// --- ADMIN ROUTES (Admin only) ---
/**
 * @route POST /api/event-services
 * @description Buat record event service baru
 * @access Admin only
 * @requires token
 * @body {string} nama_service - Nama service (misal: "Dokumentasi Foto & Video")
 * @body {number} harga - Harga service (Rp)
 * @body {string} [deskripsi] - Keterangan/deskripsi service
 * @body {string} [status] - Status keaktifan ('aktif', 'nonaktif')
 * @returns {201} Service berhasil dibuat
 */
router.post('/',    verifyToken, isAdmin, createService);

/**
 * @route PUT /api/event-services/:id
 * @description Update data event service
 * @access Admin only
 * @requires token
 * @param {number} id - ID Service
 * @body {string} nama_service - Nama service
 * @body {number} harga - Harga service
 * @body {string} deskripsi - Deskripsi service
 * @body {string} status - Status ('aktif', 'nonaktif')
 * @returns {200} Service berhasil diperbarui
 */
router.put('/:id',  verifyToken, isAdmin, updateService);

/**
 * @route DELETE /api/event-services/:id
 * @description Hapus data event service berdasarkan ID
 * @access Admin only
 * @requires token
 * @param {number} id - ID Service
 * @returns {200} Service berhasil dihapus
 */
router.delete('/:id', verifyToken, isAdmin, deleteService);

module.exports = router; // Export router
