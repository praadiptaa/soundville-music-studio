/**
 * @module routes/studio
 * @description Route definitions untuk studio management (CRUD, upload gambar)
 * @requires controllers/studio.controller
 * @requires middleware/auth.middleware
 * @requires middleware/image-upload.middleware
 */
const router = require('express').Router(); // Express router
const { getAllStudios, getStudioById, createStudio, updateStudio, deleteStudio, uploadGambar } = require('../controllers/studio.controller'); // Import studio controller functions
const { verifyToken, isAdmin } = require('../middleware/auth.middleware'); // Import auth middleware
const { uploadStudio } = require('../middleware/image-upload.middleware'); // Import upload middleware

// GET /api/studios - Ambil semua studio (public)
/**
 * @route GET /api/studios
 * @description Ambil semua data studio aktif
 * @access Public
 * @returns {200} List studio aktif
 */
router.get('/',     getAllStudios);

// GET /api/studios/:id - Ambil detail studio (public)
/**
 * @route GET /api/studios/:id
 * @description Ambil detail studio berdasarkan ID
 * @access Public
 * @param {number} id - ID Studio
 * @returns {200} Detail studio
 */
router.get('/:id',  getStudioById);

// POST /api/studios - Buat studio baru (admin only)
/**
 * @route POST /api/studios
 * @description Buat record studio baru
 * @access Admin only
 * @requires token
 * @body {string} nama_studio - Nama studio
 * @body {string} tipe - Tipe studio (misal: "Standard", "Premium")
 * @body {number} harga_per_jam - Tarif sewa per jam (Rp)
 * @body {string} [deskripsi] - Keterangan/deskripsi studio
 * @body {string} [status] - Status keaktifan ('aktif', 'nonaktif')
 * @returns {201} Studio berhasil dibuat
 */
router.post('/',    verifyToken, isAdmin, createStudio);

// PUT /api/studios/:id - Update studio (admin only)
/**
 * @route PUT /api/studios/:id
 * @description Update data studio
 * @access Admin only
 * @requires token
 * @param {number} id - ID Studio
 * @body {string} nama_studio - Nama studio
 * @body {string} tipe - Tipe studio
 * @body {number} harga_per_jam - Tarif sewa per jam
 * @body {string} deskripsi - Deskripsi studio
 * @body {string} status - Status ('aktif', 'nonaktif')
 * @returns {200} Studio berhasil diperbarui
 */
router.put('/:id',  verifyToken, isAdmin, updateStudio);

// POST /api/studios/:id/upload-gambar - Upload gambar studio (admin only)
/**
 * @route POST /api/studios/:id/upload-gambar
 * @description Upload foto/gambar studio
 * @access Admin only
 * @requires token
 * @param {number} id - ID Studio
 * @body {file} gambar - Single image file
 * @returns {200} Gambar berhasil di-upload
 */
router.post('/:id/upload-gambar', verifyToken, isAdmin, uploadStudio.single('gambar'), uploadGambar);

// DELETE /api/studios/:id - Hapus studio (admin only)
/**
 * @route DELETE /api/studios/:id
 * @description Hapus data studio berdasarkan ID
 * @access Admin only
 * @requires token
 * @param {number} id - ID Studio
 * @returns {200} Studio berhasil dihapus
 */
router.delete('/:id', verifyToken, isAdmin, deleteStudio);

module.exports = router; // Export router
