/**
 * @module routes/eventPackage
 * @description Route definitions untuk event package management (CRUD, upload gambar)
 * @requires controllers/eventPackage.controller
 * @requires middleware/auth.middleware
 * @requires middleware/image-upload.middleware
 */
const express = require('express') // Express framework
const router = express.Router() // Express router
const { uploadPackage } = require('../middleware/supabase-upload.middleware') // Import Supabase upload middleware
const { getAll, getById, create, update, deletePackage, uploadGambar } = require('../controllers/eventPackage.controller') // Import event package controller functions
const { verifyToken, isAdmin } = require('../middleware/auth.middleware') // Import auth middleware

// --- PUBLIC ROUTES (Tidak perlu login) ---
/**
 * @route GET /api/event-packages
 * @description Ambil semua paket event aktif
 * @access Public
 * @returns {200} List paket event aktif
 */
router.get('/', getAll)

/**
 * @route GET /api/event-packages/:id
 * @description Ambil detail paket event berdasarkan ID
 * @access Public
 * @param {number} id - ID Paket
 * @returns {200} Detail paket event
 */
router.get('/:id', getById)

// --- ADMIN ROUTES (Admin only) ---
/**
 * @route POST /api/event-packages
 * @description Buat record paket event baru
 * @access Admin only
 * @requires token
 * @body {string} nama_paket - Nama paket
 * @body {number} harga - Harga paket (Rp)
 * @body {string} [deskripsi] - Keterangan/deskripsi paket
 * @body {string} [fasilitas] - Daftar fasilitas
 * @body {number} [durasi_hari] - Durasi pemakaian paket dalam hari
 * @body {string} [status] - Status ('aktif', 'nonaktif')
 * @returns {201} Paket event berhasil dibuat
 */
router.post('/', verifyToken, isAdmin, create)

/**
 * @route PUT /api/event-packages/:id
 * @description Update data paket event
 * @access Admin only
 * @requires token
 * @param {number} id - ID Paket
 * @body {string} nama_paket - Nama paket
 * @body {number} harga - Harga paket (Rp)
 * @body {string} deskripsi - Deskripsi paket
 * @body {string} fasilitas - Daftar fasilitas
 * @body {number} durasi_hari - Durasi pemakaian paket dalam hari
 * @body {string} status - Status ('aktif', 'nonaktif')
 * @returns {200} Paket event berhasil diperbarui
 */
router.put('/:id', verifyToken, isAdmin, update)

/**
 * @route DELETE /api/event-packages/:id
 * @description Hapus data paket event berdasarkan ID
 * @access Admin only
 * @requires token
 * @param {number} id - ID Paket
 * @returns {200} Paket event berhasil dihapus
 */
router.delete('/:id', verifyToken, isAdmin, deletePackage)

/**
 * @route POST /api/event-packages/:id/upload-gambar
 * @description Upload foto/gambar paket event
 * @access Admin only
 * @requires token
 * @param {number} id - ID Paket
 * @body {file} gambar - Single image file
 * @returns {200} Gambar berhasil di-upload
 */
router.post('/:id/upload-gambar', verifyToken, isAdmin, uploadPackage.single('gambar'), uploadGambar)

module.exports = router // Export router
