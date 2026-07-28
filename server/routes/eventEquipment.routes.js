/**
 * @module routes/eventEquipment
 * @description Route definitions untuk event equipment management (CRUD, upload gambar, package assignment)
 * @requires controllers/eventEquipment.controller
 * @requires middleware/auth.middleware
 * @requires middleware/image-upload.middleware
 */
const router = require('express').Router(); // Express router
const { verifyToken, isAdmin } = require('../middleware/auth.middleware'); // Import auth middleware
const { uploadEquipment } = require('../middleware/image-upload.middleware'); // Import upload middleware
const equipmentController = require('../controllers/eventEquipment.controller'); // Import equipment controller functions

// --- PUBLIC ROUTES (Tidak perlu login) ---
/**
 * @route GET /api/event-equipment
 * @description Ambil semua equipment aktif
 * @access Public
 * @returns {200} List equipment aktif
 */
router.get('/', equipmentController.getAll);

/**
 * @route GET /api/event-equipment/:id
 * @description Ambil detail equipment berdasarkan ID
 * @access Public
 * @param {number} id - ID Equipment
 * @returns {200} Detail equipment
 */
router.get('/:id', equipmentController.getById);

/**
 * @route GET /api/event-equipment/package/:id_package
 * @description Ambil list equipment aktif yang termasuk dalam paket tertentu
 * @access Public
 * @param {number} id_package - ID Paket
 * @returns {200} List equipment paket
 */
router.get('/package/:id_package', equipmentController.getByPackage);

// --- ADMIN ROUTES (Admin only) ---
/**
 * @route POST /api/event-equipment
 * @description Buat record equipment baru
 * @access Admin only
 * @requires token
 * @body {string} nama_alat - Nama equipment
 * @body {string} spesifikasi - Deskripsi spesifikasi
 * @body {number} [harga_sewa] - Harga sewa per hari
 * @body {number} [durasi_hari] - Durasi sewa default dalam hari
 * @body {string} [status] - Status ('aktif', 'nonaktif')
 * @returns {201} Equipment berhasil dibuat
 */
router.post('/', verifyToken, isAdmin, equipmentController.create);

/**
 * @route PUT /api/event-equipment/:id
 * @description Update data equipment
 * @access Admin only
 * @requires token
 * @param {number} id - ID Equipment
 * @body {string} nama_alat - Nama equipment
 * @body {string} spesifikasi - Deskripsi spesifikasi
 * @body {number} harga_sewa - Harga sewa per hari
 * @body {number} durasi_hari - Durasi sewa default dalam hari
 * @body {string} status - Status ('aktif', 'nonaktif')
 * @returns {200} Equipment berhasil diperbarui
 */
router.put('/:id', verifyToken, isAdmin, equipmentController.update);

/**
 * @route DELETE /api/event-equipment/:id
 * @description Hapus data equipment berdasarkan ID
 * @access Admin only
 * @requires token
 * @param {number} id - ID Equipment
 * @returns {200} Equipment berhasil dihapus
 */
router.delete('/:id', verifyToken, isAdmin, equipmentController.deleteEquipment);

/**
 * @route POST /api/event-equipment/:id/upload-gambar
 * @description Upload foto/gambar equipment
 * @access Admin only
 * @requires token
 * @param {number} id - ID Equipment
 * @body {file} gambar - Single image file
 * @returns {200} Gambar berhasil di-upload dan path disimpan
 */
router.post('/:id/upload-gambar', verifyToken, isAdmin, uploadEquipment.single('gambar'), equipmentController.uploadGambar);

/**
 * @route POST /api/event-equipment/package/:id_package/add/:id_equipment
 * @description Hubungkan equipment ke dalam paket event tertentu
 * @access Admin only
 * @requires token
 * @param {number} id_package - ID Paket
 * @param {number} id_equipment - ID Equipment
 * @returns {200} Equipment berhasil dimasukkan ke paket
 */
router.post('/package/:id_package/add/:id_equipment', verifyToken, isAdmin, equipmentController.addToPackage);

/**
 * @route DELETE /api/event-equipment/package/:id_package/remove/:id_equipment
 * @description Hapus hubungan equipment dari paket event tertentu
 * @access Admin only
 * @requires token
 * @param {number} id_package - ID Paket
 * @param {number} id_equipment - ID Equipment
 * @returns {200} Equipment berhasil dihapus dari paket
 */
router.delete('/package/:id_package/remove/:id_equipment', verifyToken, isAdmin, equipmentController.removeFromPackage);

module.exports = router; // Export router
