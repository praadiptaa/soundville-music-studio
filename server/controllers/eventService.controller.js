const EventServiceModel = require('../models/eventService.model');

/**
 * Ambil semua event services dengan filter opsional
 * 
 * @description
 * Fetch semua services yang tersedia untuk event customers pilih.
 * Services adalah layanan tambahan seperti catering, decoration, photography, dll.
 * Bisa filter berdasarkan status (aktif/inactive) via query parameter.
 * 
 * @async
 * @route GET /api/event-services
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.status] - Filter status (aktif/inactive, opsional)
 * @param {Object} res - Express response object
 * 
 * @returns {200} List services
 * @returns {Array<Object>} Array of service objects
 * 
 * @throws {500} Database error
 * 
 * @public
 * 
 * @example
 * GET /api/event-services
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id_service": 1,
 *       "nama_service": "Catering (100 pax)",
 *       "harga": 5000000,
 *       "deskripsi": "Paket catering menu buffet Indonesia dan internasional",
 *       "status": "aktif",
 *       "created_at": "2024-01-15T08:30:00Z"
 *     },
 *     {
 *       "id_service": 2,
 *       "nama_service": "Photography & Videography",
 *       "harga": 3500000,
 *       "deskripsi": "Paket dokumentasi lengkap dengan album digital",
 *       "status": "aktif",
 *       "created_at": "2024-01-20T10:15:00Z"
 *     }
 *   ]
 * }
 * 
 * @note
 * - Status: 'aktif' atau 'inactive'
 * - Services bisa dipilih by customer saat membuat event request
 * - Harga per service sudah include labor/expertise
 */
const getAllServices = async (req, res) => {
  try {
    const { status } = req.query;
    const services = await EventServiceModel.findAll(status || null);
    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil detail service spesifik
 * 
 * @description
 * Fetch data detail satu service tertentu dengan deskripsi lengkap dan harga.
 * Customer gunakan untuk melihat detail sebelum memilih service untuk event.
 * 
 * @async
 * @route GET /api/event-services/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Service ID
 * @param {Object} res - Express response object
 * 
 * @returns {200} Service detail
 * @returns {Object} Service object lengkap
 * 
 * @throws {404} Service tidak ditemukan
 * @throws {500} Database error
 * 
 * @public
 * 
 * @example
 * GET /api/event-services/2
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id_service": 2,
 *     "nama_service": "Photography & Videography",
 *     "harga": 3500000,
 *     "deskripsi": "Professional photography dan videography dengan drone footage. Include album digital dan soft copy.",
 *     "status": "aktif",
 *     "created_at": "2024-01-20T10:15:00Z"
 *   }
 * }
 */
const getServiceById = async (req, res) => {
  try {
    const service = await EventServiceModel.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan.' });
    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create event service baru (admin)
 * 
 * @description
 * Admin menambah service baru ke katalog. Setiap service adalah layanan yang bisa dipilih customer.
 * Service memiliki nama, harga, deskripsi, dan status aktivasi.
 * 
 * @async
 * @route POST /api/event-services
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.nama_service - Nama service (contoh: "Catering Professional")
 * @param {number} req.body.harga - Harga service dalam Rp
 * @param {string} [req.body.deskripsi] - Deskripsi detail service (opsional)
 * @param {string} [req.body.status] - Status (aktif/inactive, default: aktif)
 * @param {Object} res - Express response object
 * 
 * @returns {201} Service berhasil dibuat
 * @returns {Object} { success: true, data: Service }
 * 
 * @throws {400} nama_service atau harga kosong
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * POST /api/event-services
 * Content-Type: application/json
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * {
 *   "nama_service": "Decoration Premium",
 *   "harga": 2500000,
 *   "deskripsi": "Dekorasi tematik dengan bunga segar dan lighting design custom",
 *   "status": "aktif"
 * }
 * 
 * Response 201:
 * {
 *   "success": true,
 *   "message": "Layanan event berhasil ditambahkan.",
 *   "data": {
 *     "id_service": 5,
 *     "nama_service": "Decoration Premium",
 *     "harga": 2500000,
 *     "deskripsi": "Dekorasi tematik dengan bunga segar dan lighting design custom",
 *     "status": "aktif",
 *     "created_at": "2024-06-16T11:20:00Z"
 *   }
 * }
 * 
 * @note
 * - Nama dan harga wajib diisi
 * - Harga dalam Rupiah (Rp)
 * - Status otomatis 'aktif' jika tidak dikirim
 */
const createService = async (req, res) => {
  try {
    const { nama_service, harga, deskripsi, status } = req.body;
    if (!nama_service || !harga) {
      return res.status(400).json({ success: false, message: 'Nama service dan harga wajib diisi.' });
    }
    const id = await EventServiceModel.create({ nama_service, harga, deskripsi, status });
    const service = await EventServiceModel.findById(id);
    res.status(201).json({ success: true, message: 'Layanan event berhasil ditambahkan.', data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update event service (admin)
 * 
 * @description
 * Admin mengupdate data service (nama, harga, deskripsi, status).
 * Update harga akan affect future bookings, bukan booking yang sudah ada.
 * 
 * @async
 * @route PUT /api/event-services/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Service ID
 * @param {Object} req.body - Request body (partial update)
 * @param {string} [req.body.nama_service] - Nama service
 * @param {number} [req.body.harga] - Harga service
 * @param {string} [req.body.deskripsi] - Deskripsi
 * @param {string} [req.body.status] - Status (aktif/inactive)
 * @param {Object} res - Express response object
 * 
 * @returns {200} Service berhasil diupdate
 * @returns {Object} { success: true, data: Service updated }
 * 
 * @throws {404} Service tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * PUT /api/event-services/5
 * 
 * {
 *   "harga": 2800000,
 *   "status": "aktif"
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Layanan event berhasil diperbarui.",
 *   "data": {
 *     "id_service": 5,
 *     "nama_service": "Decoration Premium",
 *     "harga": 2800000,
 *     "status": "aktif",
 *     "updated_at": "2024-06-16T11:25:00Z"
 *   }
 * }
 */
const updateService = async (req, res) => {
  try {
    const { nama_service, harga, deskripsi, status } = req.body;
    const affected = await EventServiceModel.update(req.params.id, { nama_service, harga, deskripsi, status });
    if (!affected) return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan.' });
    const service = await EventServiceModel.findById(req.params.id);
    res.json({ success: true, message: 'Layanan event berhasil diperbarui.', data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete event service (admin)
 * 
 * @description
 * Admin menghapus service dari katalog. Service yang sudah ada di existing orders tidak akan terpengaruh.
 * Implementasi soft-delete recommended untuk keep history (currently hard-delete).
 * 
 * @async
 * @route DELETE /api/event-services/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Service ID
 * @param {Object} res - Express response object
 * 
 * @returns {200} Service berhasil dihapus
 * @returns {Object} { success: true, message: '...' }
 * 
 * @throws {404} Service tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * DELETE /api/event-services/5
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Layanan event berhasil dihapus."
 * }
 * 
 * @note
 * - Service yang sudah digunakan di event order tidak akan di-delete (keep referential integrity)
 * - Consider soft-delete untuk audit trail
 * 
 * @todo
 * - Implement soft-delete dengan timestamps
 * - Check for existing orders sebelum delete
 * - Add cascade delete handling
 */
const deleteService = async (req, res) => {
  try {
    const affected = await EventServiceModel.delete(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan.' });
    res.json({ success: true, message: 'Layanan event berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllServices, getServiceById, createService, updateService, deleteService };
