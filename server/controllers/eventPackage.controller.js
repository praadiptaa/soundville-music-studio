const EventPackageModel = require('../models/eventPackage.model')
const { uploadToSupabase } = require('../middleware/supabase-upload.middleware')

/**
 * GET /api/event-packages
 * Get all event packages
 */
/**
 * Ambil semua event packages
 * 
 * @description
 * Fetch semua event packages (paket bundling services) yang tersedia untuk customer pilih.
 * Package adalah kombinasi predefined dari services dan equipment dengan harga tertentu.
 * Customer bisa memilih package saat membuat event request untuk kemudahan.
 * 
 * @async
 * @route GET /api/event-packages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @returns {200} List packages
 * @returns {Array<Object>} Array of package objects
 * 
 * @throws {500} Database error
 * 
 * @public
 * 
 * @example
 * GET /api/event-packages
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id_package": 1,
 *       "nama_paket": "Wedding Silver",
 *       "harga": 50000000,
 *       "deskripsi": "Paket pernikahan lengkap dengan venue, catering, decoration",
 *       "fasilitas": ["Catering", "Decoration", "Photography"],
 *       "durasi_hari": 1,
 *       "status": "aktif",
 *       "gambar_package": "packages/wedding_silver.jpg"
 *     }
 *   ]
 * }
 */
const getAll = async (req, res) => {
  try {
    const packages = await EventPackageModel.findAll()
    res.json({ success: true, data: packages })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/event-packages/:id
 * Get single event package
 */
/**
 * Ambil detail package spesifik
 * 
 * @description
 * Fetch data detail satu package dengan fasilitas lengkap, harga breakdown, dan deskripsi.
 * Customer gunakan untuk review package sebelum dipilih untuk event mereka.
 * 
 * @async
 * @route GET /api/event-packages/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Package ID
 * @param {Object} res - Express response object
 * 
 * @returns {200} Package detail
 * @returns {Object} Package object lengkap
 * 
 * @throws {404} Package tidak ditemukan
 * @throws {500} Database error
 * 
 * @public
 * 
 * @example
 * GET /api/event-packages/3
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id_package": 3,
 *     "nama_paket": "Wedding Gold",
 *     "harga": 75000000,
 *     "deskripsi": "Paket premium dengan all-in services dan equipment terbaik",
 *     "fasilitas": ["Catering Premium", "Decoration Luxury", "Photography & Videography", "Sound System"],
 *     "durasi_hari": 2,
 *     "gambar_package": "packages/wedding_gold.jpg",
 *     "status": "aktif"
 *   }
 * }
 */
const getById = async (req, res) => {
  try {
    const pkg = await EventPackageModel.findById(req.params.id)
    if (!pkg) return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' })
    res.json({ success: true, data: pkg })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * POST /api/event-packages [Admin]
 * Create new event package
 */
/**
 * Create event package baru (admin)
 * 
 * @description
 * Admin menambah package baru. Package adalah bundel/paket berisi kombinasi services dan equipment.
 * Customer bisa memilih package saat membuat event untuk kemudahan (daripada pilih services satu-satu).
 * 
 * @async
 * @route POST /api/event-packages
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.nama_paket - Nama package (contoh: "Wedding Silver")
 * @param {number} req.body.harga - Harga total package dalam Rp
 * @param {string} [req.body.deskripsi] - Deskripsi detail
 * @param {string} [req.body.fasilitas] - List fasilitas yang included (comma-separated atau JSON)
 * @param {number} [req.body.durasi_hari] - Durasi event (jumlah hari)
 * @param {string} [req.body.status] - Status (aktif/inactive)
 * @param {Object} res - Express response object
 * 
 * @returns {201} Package berhasil dibuat
 * @returns {Object} { success: true, data: { id_package } }
 * 
 * @throws {400} nama_paket atau harga kosong
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * POST /api/event-packages
 * Content-Type: application/json
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * {
 *   "nama_paket": "Corporate Event Standar",
 *   "harga": 30000000,
 *   "deskripsi": "Paket acara korporat dengan meeting facilities dan catering",
 *   "fasilitas": ["Meeting Room", "Catering", "Sound System", "Projection"],
 *   "durasi_hari": 1,
 *   "status": "aktif"
 * }
 * 
 * Response 201:
 * {
 *   "success": true,
 *   "message": "Paket event berhasil dibuat",
 *   "data": { "id_package": 8 }
 * }
 * 
 * @note
 * - Nama dan harga wajib diisi
 * - Fasilitas dapat list services/equipment yang included
 * - Durasi dalam hari (1, 2, 3, dst)
 */
const create = async (req, res) => {
  try {
    const { nama_paket, harga, deskripsi, fasilitas, durasi_hari, status } = req.body

    if (!nama_paket || !harga) {
      return res.status(400).json({ success: false, message: 'Nama dan harga paket wajib diisi' })
    }

    const id = await EventPackageModel.create({
      nama_paket,
      harga,
      deskripsi,
      fasilitas,
      durasi_hari,
      status
    })

    res.status(201).json({
      success: true,
      message: 'Paket event berhasil dibuat',
      data: { id_package: id }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * PUT /api/event-packages/:id [Admin]
 * Update event package
 */
/**
 * Update event package (admin)
 * 
 * @description
 * Admin mengupdate data package (nama, harga, fasilitas, status).
 * Update harga akan affect future bookings yang menggunakan package ini.
 * 
 * @async
 * @route PUT /api/event-packages/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Package ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.nama_paket - Nama package
 * @param {number} req.body.harga - Harga package
 * @param {string} [req.body.deskripsi] - Deskripsi
 * @param {string} [req.body.fasilitas] - List fasilitas
 * @param {number} [req.body.durasi_hari] - Durasi
 * @param {string} [req.body.status] - Status
 * @param {Object} res - Express response object
 * 
 * @returns {200} Package berhasil diupdate
 * @returns {Object} { success: true, data: Package updated }
 * 
 * @throws {400} nama_paket atau harga kosong
 * @throws {404} Package tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * PUT /api/event-packages/3
 * 
 * {
 *   "harga": 80000000,
 *   "fasilitas": ["Catering Premium", "Decoration Luxury", "Photography & Videography", "Sound System", "DJ"]
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Paket event berhasil diperbarui",
 *   "data": { "id_package": 3, "harga": 80000000 }
 * }
 */
const update = async (req, res) => {
  try {
    const { nama_paket, harga, deskripsi, fasilitas, durasi_hari, status } = req.body

    if (!nama_paket || !harga) {
      return res.status(400).json({ success: false, message: 'Nama dan harga paket wajib diisi' })
    }

    const success = await EventPackageModel.update(req.params.id, {
      nama_paket,
      harga,
      deskripsi,
      fasilitas,
      durasi_hari,
      status
    })

    if (!success) {
      return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' })
    }

    const updated = await EventPackageModel.findById(req.params.id)
    res.json({
      success: true,
      message: 'Paket event berhasil diperbarui',
      data: updated
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * DELETE /api/event-packages/:id [Admin]
 * Delete event package
 */
/**
 * Delete event package (admin)
 * 
 * @description
 * Admin menghapus package dari katalog. Package yang sudah dipilih di existing events tidak akan terpengaruh.
 * 
 * @async
 * @route DELETE /api/event-packages/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Package ID
 * @param {Object} res - Express response object
 * 
 * @returns {200} Package berhasil dihapus
 * @returns {Object} { success: true, message: '...' }
 * 
 * @throws {404} Package tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * DELETE /api/event-packages/2
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Paket event berhasil dihapus"
 * }
 * 
 * @todo
 * - Implement soft-delete
 * - Check for existing event_packages before delete
 */
const deletePackage = async (req, res) => {
  try {
    const success = await EventPackageModel.delete(req.params.id)
    if (!success) {
      return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' })
    }

    res.json({
      success: true,
      message: 'Paket event berhasil dihapus'
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * POST /api/event-packages/:id/upload-gambar [Admin]
 * Upload package image
 */
/**
 * Upload package gambar/foto (admin)
 * 
 * @description
 * Admin mengunggah gambar/foto untuk package display di customer interface.
 * Gambar disimpan ke server dan reference disimpan di database.
 * Gambar digunakan untuk menampilkan visual package di katalog/web.
 * 
 * @async
 * @route POST /api/event-packages/:id/upload-gambar
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Package ID
 * @param {Object} req.file - File dari multer upload middleware
 * @param {string} req.file.filename - Nama file yang di-upload
 * @param {Object} res - Express response object
 * 
 * @returns {200} Gambar berhasil diunggah
 * @returns {Object} { success: true, data: Package updated }
 * 
 * @throws {400} req.file tidak ada
 * @throws {404} Package tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * POST /api/event-packages/3/upload-gambar
 * Content-Type: multipart/form-data
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Form Data:
 *   - file: [image file]
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Gambar berhasil diunggah",
 *   "data": {
 *     "id_package": 3,
 *     "gambar_package": "packages/package_20240616_120500.jpg"
 *   }
 * }
 * 
 * @note
 * - File harus berupa image (JPG, PNG, WebP, dst)
 * - File disimpan dengan nama unik
 * - Old image tidak di-delete otomatis (cleanup bisa di-implement)
 */
const uploadGambar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Gambar wajib diunggah' })
    }

    const { id } = req.params
    const pkg = await EventPackageModel.findById(id)
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' })
    }

    // Upload ke Supabase Storage (bukan disk lokal)
    const publicUrl = await uploadToSupabase(req.file.buffer, 'packages', req.file.originalname)
    await EventPackageModel.uploadGambar(id, publicUrl)
    const updated = await EventPackageModel.findById(id)
    res.json({ success: true, message: 'Gambar berhasil diunggah', data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAll, getById, create, update, deletePackage, uploadGambar }
