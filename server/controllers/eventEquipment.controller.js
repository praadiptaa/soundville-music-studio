const EventEquipmentModel = require('../models/eventEquipment.model');

/**
 * GET /api/event-equipment
 * Get all event equipment
 */
/**
 * Ambil semua event equipment/alat
 * 
 * @description
 * Fetch semua equipment yang tersedia untuk disewa/digunakan dalam event.
 * Equipment termasuk: sound system, projector, lighting, decoration items, dll.
 * Bisa dipilih customer saat membuat event request atau sebagai bagian dari package.
 * 
 * @async
 * @route GET /api/event-equipment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @returns {200} List semua equipment
 * @returns {Array<Object>} Array of equipment objects
 * 
 * @throws {500} Database error
 * 
 * @public
 * 
 * @example
 * GET /api/event-equipment
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id_equipment": 1,
 *       "nama_alat": "Sound System Professional",
 *       "spesifikasi": "Power 3000W, Speaker 18 inch x2, Microphone x2",
 *       "harga_sewa": 2000000,
 *       "durasi_hari": 1,
 *       "status": "aktif",
 *       "gambar_equipment": "equipment/sound_system_pro.jpg",
 *       "created_at": "2024-01-15T08:30:00Z"
 *     },
 *     {
 *       "id_equipment": 2,
 *       "nama_alat": "Projector 4K",
 *       "spesifikasi": "Resolution 4K, Brightness 3000 lumens, Throw ratio 1.5-3",
 *       "harga_sewa": 1500000,
 *       "durasi_hari": 1,
 *       "status": "aktif",
 *       "gambar_equipment": "equipment/projector_4k.jpg"
 *     }
 *   ]
 * }
 * 
 * @note
 * - Equipment bisa dipilih saat membuat event atau sebagai part dari package
 * - harga_sewa per durasi_hari
 * - Status: aktif atau inactive
 */
const getAll = async (req, res) => {
  try {
    const equipment = await EventEquipmentModel.findAll();
    res.json({ success: true, data: equipment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/event-equipment/:id
 */
/**
 * Ambil detail equipment spesifik
 * 
 * @description
 * Fetch data lengkap satu equipment tertentu dengan spesifikasi detail, harga sewa, dan durasi.
 * Customer gunakan untuk review equipment sebelum memilihnya untuk event.
 * 
 * @async
 * @route GET /api/event-equipment/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Equipment ID
 * @param {Object} res - Express response object
 * 
 * @returns {200} Equipment detail
 * @returns {Object} Equipment object lengkap
 * 
 * @throws {404} Equipment tidak ditemukan
 * @throws {500} Database error
 * 
 * @public
 * 
 * @example
 * GET /api/event-equipment/5
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id_equipment": 5,
 *     "nama_alat": "LED Screen Backdrop",
 *     "spesifikasi": "Size 10mx5m, Resolution Full HD, Input: HDMI/DVI/USB",
 *     "harga_sewa": 5000000,
 *     "durasi_hari": 1,
 *     "status": "aktif",
 *     "gambar_equipment": "equipment/led_screen.jpg",
 *     "created_at": "2024-03-10T14:20:00Z"
 *   }
 * }
 */
const getById = async (req, res) => {
  try {
    const equipment = await EventEquipmentModel.findById(req.params.id);
    if (!equipment) return res.status(404).json({ success: false, message: 'Alat tidak ditemukan' });
    res.json({ success: true, data: equipment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/event-equipment [Admin]
 * Create new equipment
 */
/**
 * Create equipment baru (admin)
 * 
 * @description
 * Admin menambah equipment baru ke katalog. Equipment adalah alat/peralatan yang bisa disewa untuk event.
 * Setiap equipment memiliki nama, spesifikasi teknis, harga sewa, durasi standar, dan status.
 * 
 * @async
 * @route POST /api/event-equipment
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.nama_alat - Nama equipment (contoh: "Sound System Professional")
 * @param {string} [req.body.spesifikasi] - Spesifikasi teknis (power, features, dll)
 * @param {number} [req.body.harga_sewa] - Harga sewa per durasi_hari (dalam Rp, opsional)
 * @param {number} [req.body.durasi_hari] - Durasi standar (1, 2, 3 hari, default: 1)
 * @param {string} [req.body.status] - Status (aktif/inactive, default: aktif)
 * @param {Object} res - Express response object
 * 
 * @returns {201} Equipment berhasil dibuat
 * @returns {Object} { success: true, data: { id_equipment, nama_alat, ... } }
 * 
 * @throws {400} nama_alat kosong
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * POST /api/event-equipment
 * Content-Type: application/json
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * {
 *   "nama_alat": "Drone Camera 4K",
 *   "spesifikasi": "Resolution 4K, 60fps, Flight time 30 mins, Range 2km",
 *   "harga_sewa": 3000000,
 *   "durasi_hari": 1,
 *   "status": "aktif"
 * }
 * 
 * Response 201:
 * {
 *   "success": true,
 *   "data": {
 *     "id_equipment": 12,
 *     "nama_alat": "Drone Camera 4K",
 *     "spesifikasi": "Resolution 4K, 60fps, Flight time 30 mins, Range 2km",
 *     "harga_sewa": 3000000,
 *     "durasi_hari": 1,
 *     "status": "aktif"
 *   }
 * }
 * 
 * @note
 * - nama_alat wajib diisi
 * - harga_sewa bisa null jika equipment tidak disewakan (hanya untuk display/informasi)
 * - durasi_hari default 1 jika tidak dikirim
 */
const create = async (req, res) => {
  try {
    const { nama_alat, spesifikasi, harga_sewa, durasi_hari, status } = req.body;

    if (!nama_alat) {
      return res.status(400).json({ success: false, message: 'Nama alat wajib diisi' });
    }

    const id = await EventEquipmentModel.create({ nama_alat, spesifikasi, harga_sewa: harga_sewa || null, durasi_hari: durasi_hari || 1, status });
    res.status(201).json({ success: true, data: { id_equipment: id, nama_alat, spesifikasi, harga_sewa, durasi_hari, status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/event-equipment/:id [Admin]
 */
/**
 * Update equipment (admin)
 * 
 * @description
 * Admin mengupdate data equipment (nama, spesifikasi, harga sewa, durasi, status).
 * Update harga akan affect future bookings yang menggunakan equipment ini.
 * 
 * @async
 * @route PUT /api/event-equipment/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Equipment ID
 * @param {Object} req.body - Request body (partial update)
 * @param {string} req.body.nama_alat - Nama equipment
 * @param {string} [req.body.spesifikasi] - Spesifikasi
 * @param {number} [req.body.harga_sewa] - Harga sewa
 * @param {number} [req.body.durasi_hari] - Durasi
 * @param {string} [req.body.status] - Status
 * @param {Object} res - Express response object
 * 
 * @returns {200} Equipment berhasil diupdate
 * @returns {Object} { success: true, data: Equipment updated }
 * 
 * @throws {400} nama_alat kosong
 * @throws {404} Equipment tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * PUT /api/event-equipment/5
 * 
 * {
 *   "harga_sewa": 5500000,
 *   "status": "aktif"
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id_equipment": 5,
 *     "nama_alat": "LED Screen Backdrop",
 *     "harga_sewa": 5500000,
 *     "status": "aktif"
 *   }
 * }
 */
const update = async (req, res) => {
  try {
    const { nama_alat, spesifikasi, harga_sewa, durasi_hari, status } = req.body;

    if (!nama_alat) {
      return res.status(400).json({ success: false, message: 'Nama alat wajib diisi' });
    }

    await EventEquipmentModel.update(req.params.id, { nama_alat, spesifikasi, harga_sewa: harga_sewa || null, durasi_hari: durasi_hari || 1, status });
    const equipment = await EventEquipmentModel.findById(req.params.id);
    res.json({ success: true, data: equipment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/event-equipment/:id [Admin]
 */
/**
 * Delete equipment (admin)
 * 
 * @description
 * Admin menghapus equipment dari katalog. Equipment yang sudah digunakan di existing events tidak akan terpengaruh.
 * Implementasi soft-delete recommended untuk audit trail.
 * 
 * @async
 * @route DELETE /api/event-equipment/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Equipment ID
 * @param {Object} res - Express response object
 * 
 * @returns {200} Equipment berhasil dihapus
 * @returns {Object} { success: true, message: '...' }
 * 
 * @throws {404} Equipment tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * DELETE /api/event-equipment/12
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Alat dihapus"
 * }
 * 
 * @note
 * - Currently hard-delete, consider soft-delete untuk audit
 * - Equipment yang sudah digunakan di event/package keep intact
 */
const deleteEquipment = async (req, res) => {
  try {
    const affected = await EventEquipmentModel.delete(req.params.id);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Alat tidak ditemukan' });
    res.json({ success: true, message: 'Alat dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/event-equipment/package/:id_package
 * Get equipment for specific package
 */
/**
 * Ambil equipment yang termasuk dalam specific package
 * 
 * @description
 * Fetch semua equipment yang sudah di-include/di-bundle dalam package tertentu.
 * Admin gunakan untuk manage equipment associations dengan packages.
 * Customer gunakan untuk lihat apa saja equipment yang included dalam package.
 * 
 * @async
 * @route GET /api/event-equipment/package/:id_package
 * @param {Object} req - Express request object
 * @param {string} req.params.id_package - Package ID
 * @param {Object} res - Express response object
 * 
 * @returns {200} List equipment dalam package
 * @returns {Array<Object>} Array of equipment objects
 * 
 * @throws {500} Database error
 * 
 * @public
 * 
 * @example
 * GET /api/event-equipment/package/3
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id_equipment": 1,
 *       "nama_alat": "Sound System Professional",
 *       "harga_sewa": 2000000,
 *       "spesifikasi": "Power 3000W, Speaker 18 inch x2"
 *     },
 *     {
 *       "id_equipment": 5,
 *       "nama_alat": "LED Screen Backdrop",
 *       "harga_sewa": 5000000,
 *       "spesifikasi": "Size 10mx5m, Resolution Full HD"
 *     }
 *   ]
 * }
 * 
 * @note
 * - Equipment dalam package adalah bundling untuk kemudahan customer
 */
const getByPackage = async (req, res) => {
  try {
    const equipment = await EventEquipmentModel.getByPackage(req.params.id_package);
    res.json({ success: true, data: equipment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/event-equipment/package/:id_package/add/:id_equipment [Admin]
 */
/**
 * Tambah equipment ke package (admin)
 * 
 * @description
 * Admin menambahkan equipment tertentu ke dalam package bundle.
 * Ini membuat equipment ter-include dalam package untuk kemudahan customer.
 * Sama seperti "add to cart" tapi untuk admin managing packages.
 * 
 * @async
 * @route POST /api/event-equipment/package/:id_package/add/:id_equipment
 * @param {Object} req - Express request object
 * @param {string} req.params.id_package - Package ID
 * @param {string} req.params.id_equipment - Equipment ID untuk ditambah
 * @param {Object} res - Express response object
 * 
 * @returns {200} Equipment berhasil ditambahkan ke package
 * @returns {Object} { success: true, message: '...' }
 * 
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * POST /api/event-equipment/package/3/add/5
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Alat ditambahkan ke paket"
 * }
 * 
 * @note
 * - Prevent duplicate: equipment tidak bisa ditambah 2x ke package yang sama
 * - Soft association: equipment tetap exist independently
 */
const addToPackage = async (req, res) => {
  try {
    const { id_package, id_equipment } = req.params;
    await EventEquipmentModel.addToPackage(id_package, id_equipment);
    res.json({ success: true, message: 'Alat ditambahkan ke paket' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/event-equipment/package/:id_package/remove/:id_equipment [Admin]
 */
/**
 * Hapus equipment dari package (admin)
 * 
 * @description
 * Admin menghapus equipment dari dalam package bundle.
 * Equipment tetap exist di database, hanya association dengan package yang dihapus.
 * Ini seperti "remove from cart" untuk package management.
 * 
 * @async
 * @route DELETE /api/event-equipment/package/:id_package/remove/:id_equipment
 * @param {Object} req - Express request object
 * @param {string} req.params.id_package - Package ID
 * @param {string} req.params.id_equipment - Equipment ID untuk dihapus
 * @param {Object} res - Express response object
 * 
 * @returns {200} Equipment berhasil dihapus dari package
 * @returns {Object} { success: true, message: '...' }
 * 
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * DELETE /api/event-equipment/package/3/remove/5
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Alat dihapus dari paket"
 * }
 * 
 * @note
 * - Equipment masih bisa dipilih secara individual di event
 * - Package harga harus di-adjust jika equipment dengan harga besar dihapus
 */
const removeFromPackage = async (req, res) => {
  try {
    const { id_package, id_equipment } = req.params;
    await EventEquipmentModel.removeFromPackage(id_package, id_equipment);
    res.json({ success: true, message: 'Alat dihapus dari paket' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/event-equipment/:id/upload-gambar [Admin]
 * Upload equipment image
 */
/**
 * Upload equipment gambar/foto (admin)
 * 
 * @description
 * Admin mengunggah gambar/foto equipment untuk display di customer interface.
 * Gambar disimpan ke server dan reference disimpan di database.
 * Customer dapat melihat gambar equipment sebelum memilihnya.
 * 
 * @async
 * @route POST /api/event-equipment/:id/upload-gambar
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Equipment ID
 * @param {Object} req.file - File dari multer upload middleware
 * @param {string} req.file.filename - Nama file yang di-upload
 * @param {Object} res - Express response object
 * 
 * @returns {200} Gambar berhasil diunggah
 * @returns {Object} { success: true, data: Equipment updated dengan gambar_equipment path }
 * 
 * @throws {400} req.file tidak ada
 * @throws {404} Equipment tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * POST /api/event-equipment/5/upload-gambar
 * Content-Type: multipart/form-data
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Form Data:
 *   - gambar: [image file]
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Gambar berhasil diunggah",
 *   "data": {
 *     "id_equipment": 5,
 *     "nama_alat": "LED Screen Backdrop",
 *     "gambar_equipment": "equipment/led_screen_20240616_120500.jpg"
 *   }
 * }
 * 
 * @note
 * - File harus berupa image (JPG, PNG, WebP)
 * - File disimpan dengan nama unik
 * - Old image tidak di-delete otomatis (cleanup implementasi terpisah)
 * - Gambar akan ditampilkan di customer catalog
 */
const uploadGambar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Gambar wajib diunggah' });
    }

    const { id } = req.params;
    const equipment = await EventEquipmentModel.findById(id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Alat tidak ditemukan' });
    }

    const filePath = `equipment/${req.file.filename}`;
    await EventEquipmentModel.uploadGambar(id, filePath);
    const updated = await EventEquipmentModel.findById(id);
    res.json({ success: true, message: 'Gambar berhasil diunggah', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteEquipment,
  getByPackage,
  addToPackage,
  removeFromPackage,
  uploadGambar,
};
