const EventPaymentModel = require('../models/eventPayment.model');
const EventModel = require('../models/event.model');
const { uploadToSupabase } = require('../middleware/supabase-upload.middleware');

/**
 * Upload bukti transfer pembayaran event
 * 
 * @description
 * Customer mengunggah bukti transfer (screenshot, slip transfer) untuk pembayaran event services dan equipment.
 * Event harus status 'approved' terlebih dahulu sebelum bisa upload payment (bukan 'pending' atau 'rejected').
 * Sistem akan:
 * 1. Validasi event milik customer dan status approved
 * 2. Cek sudah ada payment sebelumnya (prevent duplicate)
 * 3. Save file ke folder uploads/payments/
 * 4. Create event payment record dengan status 'pending'
 * Admin kemudian verifikasi dan ubah status ke 'verified' atau 'rejected'.
 * 
 * @async
 * @route POST /api/event-payments
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {number} req.body.id_event - ID event yang akan dibayar
 * @param {string} [req.body.metode] - Metode pembayaran (opsional)
 * @param {Object} req.file - File dari multer upload middleware
 * @param {string} req.file.filename - Nama file yang di-upload
 * @param {Object} req.user - User object dari JWT
 * @param {number} req.user.id_user - ID customer yang upload
 * @param {Object} res - Express response object
 * 
 * @returns {201} Bukti pembayaran event berhasil dikirim
 * @returns {Object} { success: true, data: { id_event_payment, bukti_transfer } }
 * 
 * @throws {400}
 *         - id_event kosong
 *         - req.file tidak ada
 *         - Event status bukan 'approved' atau 'completed'
 * @throws {403} Customer mencoba upload payment untuk event orang lain
 * @throws {404} Event tidak ditemukan
 * @throws {409} Pembayaran event sudah dikirim
 * @throws {500} Server error
 * 
 * @requires customer
 * 
 * @example
 * POST /api/event-payments
 * Content-Type: multipart/form-data
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Form Data:
 *   - id_event: 45
 *   - bukti_transfer: [file object]
 * 
 * Response 201:
 * {
 *   "success": true,
 *   "message": "Bukti pembayaran event berhasil dikirim. Menunggu verifikasi admin.",
 *   "data": {
 *     "id_event_payment": 12,
 *     "bukti_transfer": "uploads/payments/event_payment_20240616_145320.jpg"
 *   }
 * }
 * 
 * Response 400 (Event not approved):
 * {
 *   "success": false,
 *   "message": "Pembayaran hanya bisa untuk event yang sudah disetujui admin."
 * }
 * 
 * @note
 * - Event harus status 'approved' atau 'completed' untuk payment upload
 * - Metode pembayaran baru di-set saat admin verifikasi (null saat upload)
 * - File disimpan dengan nama unik
 * - Event payment dan booking payment adalah sistem terpisah
 * 
 * @todo
 * - Support for partial/installment payments
 * - Auto-calculate remaining payment due
 * - Email reminder jika payment overdue
 */
const uploadEventPayment = async (req, res) => {
  try {
    const { id_event, tipe_pembayaran } = req.body;
    const id_user = req.user.id_user;

    if (!id_event) {
      return res.status(400).json({ success: false, message: 'id_event wajib diisi.' });
    }

    const event = await EventModel.findById(id_event);
    if (!event) return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    if (event.id_user !== id_user) return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    if (!['approved', 'completed', 'confirmed'].includes(event.status_event)) {
      return res.status(400).json({ success: false, message: 'Pembayaran hanya bisa untuk event yang sudah disetujui admin.' });
    }

    // Hitung total biaya event: paket (adjusted/regular) + services + equipment
    const paketBiaya  = parseFloat(event.paket_biaya_adjusted || event.paket_harga || 0);
    const totalBiaya  = parseFloat(event.total_biaya || 0);
    const totalEquip  = (event.rentals || []).reduce((s, r) => s + parseFloat(r.harga_satuan || r.total_harga || 0), 0);
    const grandTotal  = paketBiaya + totalBiaya + totalEquip;

    const existing = await EventPaymentModel.findByEventId(id_event);
    if (existing) {
      // Handler Pelunasan: jika DP terverifikasi dan belum lunas (metode belum di-set)
      if (existing.status_payment === 'verified' && existing.tipe_pembayaran === 'dp' && !existing.metode) {
        if (!req.file) {
          return res.status(400).json({ success: false, message: 'Bukti transfer pelunasan wajib diupload.' });
        }
        const bukti_transfer = await uploadToSupabase(req.file.buffer, 'payments', req.file.originalname, 'soundville-payments');
        // Update tipe_pembayaran ke 'full_payment' (lunas) dan status_payment ke 'pending' agar admin verifikasi pelunasannya
        await EventPaymentModel.updateProof(existing.id_event_payment, bukti_transfer, grandTotal, 'full_payment');
        return res.status(200).json({
          success: true,
          message: 'Bukti pelunasan event berhasil dikirim. Menunggu verifikasi admin.',
          data: { id_event_payment: existing.id_event_payment, bukti_transfer },
        });
      }

      if (existing.status_payment === 'rejected') {
        if (!req.file) {
          return res.status(400).json({ success: false, message: 'Bukti transfer wajib diupload.' });
        }

        const tipe = tipe_pembayaran || existing.tipe_pembayaran || 'dp';
        const jumlah_bayar = grandTotal > 0 ? (tipe === 'full_payment' ? grandTotal : Math.round(grandTotal * 0.5)) : null;

        const bukti_transfer = await uploadToSupabase(req.file.buffer, 'payments', req.file.originalname, 'soundville-payments');
        await EventPaymentModel.updateProof(existing.id_event_payment, bukti_transfer, jumlah_bayar, tipe);
        return res.status(200).json({
          success: true,
          message: 'Bukti pembayaran event berhasil di-upload ulang. Menunggu verifikasi admin.',
          data: {
            id_event_payment: existing.id_event_payment,
            bukti_transfer,
            jumlah_bayar,
            tipe_pembayaran: tipe,
          },
        });
      }
      return res.status(409).json({ success: false, message: 'Pembayaran untuk event ini sudah dikirim.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Bukti transfer wajib diupload.' });
    }

    const tipe = tipe_pembayaran || 'dp';
    const jumlah_bayar = grandTotal > 0 ? (tipe === 'full_payment' ? grandTotal : Math.round(grandTotal * 0.5)) : null;

    const bukti_transfer = await uploadToSupabase(req.file.buffer, 'payments', req.file.originalname, 'soundville-payments');
    const id_event_payment = await EventPaymentModel.create({
      id_event,
      metode: null,
      jumlah_bayar,
      tipe_pembayaran: tipe,
      bukti_transfer,
    });

    res.status(201).json({
      success: true,
      message: `Bukti pembayaran ${tipe === 'dp' ? 'DP' : 'pelunasan'} event berhasil dikirim. Menunggu verifikasi admin.`,
      data: {
        id_event_payment,
        bukti_transfer,
        jumlah_bayar,
        tipe_pembayaran: tipe,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * Ambil semua event payments (admin)
 * 
 * @description
 * Admin view semua event payment records untuk monitoring pembayaran event.
 * Terpisah dari booking payment (tabel berbeda, endpoint berbeda).
 * 
 * @async
 * @route GET /api/event-payments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @returns {200} List semua event payments
 * @returns {Array<Object>} Array of event payment objects
 * 
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * GET /api/event-payments
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id_event_payment": 1,
 *       "id_event": 45,
 *       "status_payment": "pending",
 *       "metode": null,
 *       "bukti_transfer": "uploads/payments/event_payment_20240616_145320.jpg",
 *       "created_at": "2024-06-16T14:53:20Z"
 *     }
 *   ]
 * }
 */
const getAllEventPayments = async (req, res) => {
  try {
    const payments = await EventPaymentModel.findAll();
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil detail event payment spesifik
 * 
 * @description
 * Admin retrieve data detail event payment untuk review sebelum verifikasi.
 * 
 * @async
 * @route GET /api/event-payments/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Event Payment ID
 * @param {Object} res - Express response object
 * 
 * @returns {200} Event payment detail
 * @returns {Object} Event payment object
 * 
 * @throws {404} Event payment tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * GET /api/event-payments/12
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id_event_payment": 12,
 *     "id_event": 45,
 *     "status_payment": "pending",
 *     "metode": null,
 *     "bukti_transfer": "uploads/payments/event_payment_20240616_145320.jpg",
 *     "catatan_admin": null,
 *     "created_at": "2024-06-16T14:53:20Z"
 *   }
 * }
 */
const getEventPaymentById = async (req, res) => {
  try {
    const payment = await EventPaymentModel.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment event tidak ditemukan.' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil event payment berdasarkan ID event (untuk admin detail & customer status)
 * @route GET /api/event-payments/event/:id_event
 */
const getPaymentByEventId = async (req, res) => {
  try {
    const payment = await EventPaymentModel.findByEventId(req.params.id_event);
    if (!payment) return res.status(404).json({ success: false, message: 'Belum ada pembayaran untuk event ini.' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * Verifikasi atau tolak event payment (admin)
 * 
 * @description
 * Admin mengverifikasi bukti pembayaran event dari customer.
 * 2 action yang bisa dilakukan:
 * 1. VERIFIED: Terima pembayaran, set metode, otomatis konfirmasi event
 * 2. REJECTED: Tolak pembayaran dengan catatan, customer bisa upload ulang
 * 
 * @async
 * @route PUT /api/event-payments/verify/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Event Payment ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.status_payment - Status (verified/rejected)
 * @param {string} [req.body.catatan_admin] - Catatan (wajib jika rejected)
 * @param {Object} res - Express response object
 * 
 * @returns {200} Event payment berhasil diverifikasi
 * @returns {Object} { success: true, message: '...' }
 * 
 * @throws {400}
 *         - Status tidak valid
 *         - Catatan kosong untuk rejected status
 * @throws {404} Event payment tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * PUT /api/event-payments/verify/12
 * 
 * {
 *   "status_payment": "verified",
 *   "catatan_admin": "Pembayaran event terverifikasi. Services dan equipment siap diproses."
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Pembayaran event berhasil diverifikasi."
 * }
 * 
 * @note
 * - Verified payment otomatis update event status jadi 'confirmed'
 * - Terpisah dari booking payment (sistem terpisah)
 * 
 * @todo
 * - Add payment breakdown (services, equipment, package pricing)
 * - Implement installment payment tracking
 */
const verifyEventPayment = async (req, res) => {
  try {
    const { status_payment, catatan_admin } = req.body;
    const validStatus = ['verified', 'rejected'];

    if (!validStatus.includes(status_payment)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid. Gunakan "verified" atau "rejected".' });
    }

    if (status_payment === 'rejected' && !catatan_admin) {
      return res.status(400).json({ success: false, message: 'Catatan penolakan wajib diisi.' });
    }

    const payment = await EventPaymentModel.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment event tidak ditemukan.' });

    // Cek payment masih pending sebelum diproses
    if (payment.status_payment !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Pembayaran sudah dalam status "${payment.status_payment}", tidak dapat diproses ulang.`,
      });
    }

    const updateData = { status_payment, catatan_admin: catatan_admin || null };
    if (status_payment === 'verified' && payment.tipe_pembayaran === 'full_payment') {
      updateData.metode = 'qris';
    }

    await EventPaymentModel.verify(req.params.id, updateData);

    // Jika pembayaran diverifikasi, update event status ke 'confirmed'
    if (status_payment === 'verified') {
      try {
        await EventModel.updateStatus(payment.id_event, 'confirmed');
      } catch (statusErr) {
        console.warn('[WARN] verifyEventPayment: status "confirmed" tidak tersedia, fallback ke "approved":', statusErr.message);
        await EventModel.updateStatus(payment.id_event, 'approved');
      }
    }

    res.json({
      success: true,
      message: `Pembayaran event berhasil ${status_payment === 'verified' ? 'diverifikasi' : 'ditolak'}.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateEventPaymentStatus = async (req, res) => {
  try {
    const { status_payment, metode } = req.body;
    const id_event = req.params.id;

    if (!status_payment || !metode) {
      return res.status(400).json({ success: false, message: 'Status pembayaran dan metode wajib diisi.' });
    }

    const validStatus = ['pending', 'verified', 'rejected'];
    if (!validStatus.includes(status_payment)) {
      return res.status(400).json({ success: false, message: 'Status pembayaran tidak valid.' });
    }

    const validMetode = ['qris', 'cash'];
    if (!validMetode.includes(metode)) {
      return res.status(400).json({ success: false, message: 'Metode pembayaran tidak valid.' });
    }

    const event = await EventModel.findById(id_event);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    }

    const db = require('../config/database');
    const [existingPayment] = await db.query(
      'SELECT id_event_payment FROM event_payments WHERE id_event = ?',
      [id_event]
    );

    const paketBiaya  = parseFloat(event.paket_biaya_adjusted || event.paket_harga || 0);
    const totalBiaya  = parseFloat(event.total_biaya || 0);
    const totalEquip  = (event.rentals || []).reduce((s, r) => s + parseFloat(r.harga_satuan || r.total_harga || 0), 0);
    const grandTotal  = paketBiaya + totalBiaya + totalEquip;

    if (existingPayment.length > 0) {
      await db.query(
        "UPDATE event_payments SET status_payment = ?, metode = ?, tipe_pembayaran = 'full_payment', jumlah_bayar = ? WHERE id_event = ?",
        [status_payment, metode, grandTotal, id_event]
      );
    } else {
      await db.query(
        "INSERT INTO event_payments (id_event, metode, status_payment, tipe_pembayaran, jumlah_bayar) VALUES (?, ?, ?, 'full_payment', ?)",
        [id_event, metode, status_payment, grandTotal]
      );
    }

    res.json({ 
      success: true, 
      message: `Event ditandai sebagai lunas dengan metode ${metode.toUpperCase()}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  uploadEventPayment,
  getAllEventPayments,
  getEventPaymentById,
  getPaymentByEventId,
  verifyEventPayment,
  updateEventPaymentStatus,
};