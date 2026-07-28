const StudioModel = require('../models/studio.model');
const { uploadToSupabase } = require('../middleware/supabase-upload.middleware');

/**
 * Ambil semua studio dengan optional filter status
 * @async
 * @route GET /api/studios
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.status] - Filter berdasarkan status (aktif/nonaktif)
 * @param {Object} res - Express response object
 * @returns {200} List studio berhasil diambil
 * @returns {Array} Array of Studio objects
 * @throws {500} Server error
 * @public
 */
const getAllStudios = async (req, res) => {
  try {
    const { status } = req.query;
    const studios = await StudioModel.findAll(status || null);
    res.json({ success: true, data: studios });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil detail studio berdasarkan ID
 * @async
 * @route GET /api/studios/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Studio ID
 * @param {Object} res - Express response object
 * @returns {200} Detail studio berhasil diambil
 * @returns {Object} Studio object
 * @throws {404} Studio tidak ditemukan
 * @throws {500} Server error
 * @public
 */
const getStudioById = async (req, res) => {
  try {
    const studio = await StudioModel.findById(req.params.id);
    if (!studio) return res.status(404).json({ success: false, message: 'Studio tidak ditemukan.' });
    res.json({ success: true, data: studio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Buat studio baru
 * @async
 * @route POST /api/studios
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.nama_studio - Nama studio
 * @param {number} req.body.harga_per_jam - Harga per jam (Rp)
 * @param {string} [req.body.deskripsi] - Deskripsi studio
 * @param {string} [req.body.fasilitas] - Fasilitas yang tersedia
 * @param {string} [req.body.status] - Status studio (default: aktif)
 * @param {Object} res - Express response object
 * @returns {201} Studio berhasil dibuat
 * @returns {Object} { success: true, data: Studio }
 * @throws {400} Jika nama_studio atau harga_per_jam kosong
 * @throws {500} Server error
 * @requires admin
 */
const createStudio = async (req, res) => {
  try {
    const { nama_studio, harga_per_jam, deskripsi, fasilitas, status } = req.body;
    if (!nama_studio || !harga_per_jam) {
      return res.status(400).json({ success: false, message: 'Nama studio dan harga wajib diisi.' });
    }
    const id = await StudioModel.create({ nama_studio, harga_per_jam, deskripsi, fasilitas, status });
    const studio = await StudioModel.findById(id);
    res.status(201).json({ success: true, message: 'Studio berhasil dibuat.', data: studio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update informasi studio
 * @async
 * @route PUT /api/studios/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Studio ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.nama_studio - Nama studio
 * @param {number} req.body.harga_per_jam - Harga per jam (Rp)
 * @param {string} req.body.deskripsi - Deskripsi studio
 * @param {string} req.body.fasilitas - Fasilitas yang tersedia
 * @param {string} req.body.foto - Path foto studio
 * @param {string} req.body.status - Status studio
 * @param {Object} res - Express response object
 * @returns {200} Studio berhasil diupdate
 * @returns {Object} { success: true, data: Studio }
 * @throws {404} Studio tidak ditemukan
 * @throws {500} Server error
 * @requires admin
 */
const updateStudio = async (req, res) => {
  try {
    const { nama_studio, harga_per_jam, deskripsi, fasilitas, foto, status } = req.body;
    const affected = await StudioModel.update(req.params.id, { nama_studio, harga_per_jam, deskripsi, fasilitas, foto, status });
    if (!affected) return res.status(404).json({ success: false, message: 'Studio tidak ditemukan.' });
    const studio = await StudioModel.findById(req.params.id);
    res.json({ success: true, message: 'Studio berhasil diperbarui.', data: studio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Hapus studio
 * @async
 * @route DELETE /api/studios/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Studio ID
 * @param {Object} res - Express response object
 * @returns {200} Studio berhasil dihapus
 * @returns {Object} { success: true, message: string }
 * @throws {404} Studio tidak ditemukan
 * @throws {500} Server error
 * @requires admin
 */
const deleteStudio = async (req, res) => {
  try {
    const affected = await StudioModel.delete(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Studio tidak ditemukan.' });
    res.json({ success: true, message: 'Studio berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Upload/update gambar studio
 * @async
 * @route POST /api/studios/:id/upload-gambar
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Studio ID
 * @param {Object} req.file - Upload file dari multipart form-data
 * @param {string} req.file.filename - Nama file yang sudah di-process
 * @param {Object} res - Express response object
 * @returns {200} Gambar berhasil diunggah
 * @returns {Object} { success: true, data: Studio }
 * @throws {400} Jika file gambar tidak diunggah
 * @throws {404} Studio tidak ditemukan
 * @throws {500} Server error
 * @requires admin
 */
const uploadGambar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Gambar wajib diunggah' });
    }

    const { id } = req.params;
    const studio = await StudioModel.findById(id);
    if (!studio) {
      return res.status(404).json({ success: false, message: 'Studio tidak ditemukan' });
    }

    // Upload ke Supabase Storage (bukan disk lokal)
    const publicUrl = await uploadToSupabase(req.file.buffer, 'studios', req.file.originalname);
    await StudioModel.uploadGambar(id, publicUrl);
    const updated = await StudioModel.findById(id);
    res.json({ success: true, message: 'Gambar berhasil diunggah', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllStudios, getStudioById, createStudio, updateStudio, deleteStudio, uploadGambar };
