const PaymentModel  = require('../models/payment.model');
const BookingModel  = require('../models/booking.model');
const { uploadToSupabase } = require('../middleware/supabase-upload.middleware');

/**
 * Upload bukti transfer pembayaran booking
 * 
 * @description
 * Customer mengunggah bukti transfer (screenshot, slip transfer, etc) untuk pembayaran booking.
 * File harus berupa image (JPG, PNG, PDF). Sistem akan:
 * 1. Validasi booking milik customer yang upload
 * 2. Cek sudah ada payment sebelumnya (prevent duplicate payment)
 * 3. Save file ke folder uploads/payments/
 * 4. Create payment record dengan status 'pending' (menunggu verifikasi admin)
 * Admin kemudian akan verifikasi bukti transfer dan ubah status ke 'verified' atau 'rejected'.
 * Jika 'verified', booking status otomatis menjadi 'confirmed'.
 * 
 * @async
 * @route POST /api/payments
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {number} req.body.id_booking - ID booking yang akan dibayar
 * @param {string} [req.body.metode] - Metode pembayaran (opsional, baru di-set saat verified)
 * @param {Object} req.file - File dari multer upload middleware
 * @param {string} req.file.filename - Nama file yang di-upload (disimpan ke server)
 * @param {Object} req.user - User object dari JWT
 * @param {number} req.user.id_user - ID customer yang upload
 * @param {Object} res - Express response object
 * 
 * @returns {201} Bukti pembayaran berhasil dikirim
 * @returns {Object} { success: true, data: { id_payment, bukti_transfer } }
 * 
 * @throws {400}
 *         - id_booking kosong
 *         - req.file tidak ada (bukti transfer tidak diupload)
 * @throws {403} Customer mencoba upload payment untuk booking orang lain
 * @throws {404} Booking tidak ditemukan
 * @throws {409} Pembayaran untuk booking ini sudah dikirim (duplicate payment)
 * @throws {500} Server/database error
 * 
 * @requires customer
 * 
 * @example
 * POST /api/payments
 * Content-Type: multipart/form-data
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Form Data:
 *   - id_booking: 12
 *   - bukti_transfer: [file object]
 * 
 * Response 201:
 * {
 *   "success": true,
 *   "message": "Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.",
 *   "data": {
 *     "id_payment": 8,
 *     "bukti_transfer": "uploads/payments/payment_20240616_102345.jpg"
 *   }
 * }
 * 
 * Response 409 (Duplicate):
 * {
 *   "success": false,
 *   "message": "Pembayaran untuk booking ini sudah dikirim."
 * }
 * 
 * @note
 * - Metode pembayaran tidak disimpan saat upload (null), akan di-set saat admin verifikasi
 * - File disimpan dengan nama unik ke mencegah overwrite
 * - Payment record created dengan status 'pending' otomatis
 * - Customer bisa melihat status payment di dashboard mereka
 * 
 * @todo
 * - Add support untuk multiple payment proof (jika pembayaran cicilan)
 * - Implement OCR untuk auto-detect metode dari bukti transfer
 * - Add email notification ke admin saat payment upload
 * - Implement file validation lebih ketat (size, format, etc)
 */
const uploadPayment = async (req, res) => {
  try {
    const { id_booking, tipe_pembayaran } = req.body;
    const id_user = req.user.id_user;

    if (!id_booking) {
      return res.status(400).json({ success: false, message: 'id_booking wajib diisi.' });
    }

    // Cek booking milik user ini
    const booking = await BookingModel.findById(id_booking);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan.' });
    if (booking.id_user !== id_user) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    // Cek sudah ada payment sebelumnya
    const existing = await PaymentModel.findByBookingId(id_booking);
    if (existing) {
      if (existing.status_payment === 'rejected') {
        if (!req.file) {
          return res.status(400).json({ success: false, message: 'Bukti transfer wajib diupload.' });
        }

        // Periksa apakah jadwal masih tersedia (karena slot dibebaskan sewaktu status 'rejected')
        const isAvailable = await BookingModel.isScheduleAvailable(
          booking.id_studio,
          booking.tanggal,
          booking.jam_mulai,
          booking.jam_selesai,
          booking.id_booking
        );
        if (!isAvailable) {
          return res.status(400).json({
            success: false,
            message: 'Jadwal studio untuk booking ini sudah dipesan oleh orang lain. Silakan buat booking baru.',
          });
        }

        const bukti_transfer = await uploadToSupabase(req.file.buffer, 'payments', req.file.originalname, 'soundville-payments');
        await PaymentModel.updateProof(existing.id_payment, bukti_transfer, tipe_pembayaran);
        return res.status(200).json({
          success: true,
          message: 'Bukti pembayaran berhasil di-upload ulang. Menunggu verifikasi admin.',
          data: { id_payment: existing.id_payment, bukti_transfer },
        });
      }

      // Handler Pelunasan: jika DP terverifikasi dan belum lunas (metode belum di-set)
      if (existing.status_payment === 'verified' && existing.tipe_pembayaran === 'dp' && !existing.metode) {
        if (!req.file) {
          return res.status(400).json({ success: false, message: 'Bukti transfer pelunasan wajib diupload.' });
        }
        const bukti_transfer = await uploadToSupabase(req.file.buffer, 'payments', req.file.originalname, 'soundville-payments');
        // Update tipe_pembayaran ke 'lunas' dan status_payment ke 'pending' agar admin verifikasi pelunasannya
        await PaymentModel.updateProof(existing.id_payment, bukti_transfer, 'lunas');
        return res.status(200).json({
          success: true,
          message: 'Bukti pelunasan berhasil dikirim. Menunggu verifikasi admin.',
          data: { id_payment: existing.id_payment, bukti_transfer },
        });
      }

      return res.status(409).json({ success: false, message: 'Pembayaran untuk booking ini sudah dikirim.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Bukti transfer wajib diupload.' });
    }

    const bukti_transfer = await uploadToSupabase(req.file.buffer, 'payments', req.file.originalname, 'soundville-payments');
    // Jangan simpan metode saat upload - metode baru di-set saat admin mark as "Lunas"
    const id_payment = await PaymentModel.create({ id_booking, metode: null, bukti_transfer, tipe_pembayaran });

    res.status(201).json({
      success: true,
      message: 'Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.',
      data: { id_payment, bukti_transfer },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil semua payments (admin dashboard)
 * 
 * @description
 * Admin view semua payment records dari seluruh customer untuk monitoring dan proses verifikasi.
 * Menampilkan payment dengan berbagai status (pending, verified, rejected).
 * Admin dapat filter berdasarkan tanggal, booking ID, atau status di future version.
 * 
 * @async
 * @route GET /api/payments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @returns {200} List semua payments
 * @returns {Array<Object>} Array of payment objects dengan struktur:
 *          [
 *            {
 *              id_payment,
 *              id_booking,
 *              status_payment,
 *              metode,
 *              bukti_transfer,
 *              created_at
 *            },
 *            ...
 *          ]
 * 
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * GET /api/payments
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs... (admin token)
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id_payment": 1,
 *       "id_booking": 5,
 *       "status_payment": "pending",
 *       "metode": null,
 *       "bukti_transfer": "uploads/payments/payment_20240616_102345.jpg",
 *       "created_at": "2024-06-16T10:23:45Z"
 *     },
 *     {
 *       "id_payment": 2,
 *       "id_booking": 6,
 *       "status_payment": "verified",
 *       "metode": "BCA Transfer",
 *       "bukti_transfer": "uploads/payments/payment_20240615_143020.jpg",
 *       "created_at": "2024-06-15T14:30:20Z"
 *     }
 *   ]
 * }
 * 
 * @note
 * - Status payment bisa: 'pending' (menunggu verifikasi), 'verified' (sudah diverifikasi), 'rejected' (ditolak)
 * - Metode pembayaran hanya terisi jika status 'verified' atau 'rejected'
 * - Data dari database cache (Redis) jika tersedia
 */
const getAllPayments = async (req, res) => {
  try {
    const payments = await PaymentModel.findAll();
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil detail payment spesifik
 * 
 * @description
 * Fetch data detail payment tertentu. Admin bisa lihat semua payment.
 * Customer hanya bisa lihat payment milik booking mereka sendiri (future security enhancement).
 * 
 * @async
 * @route GET /api/payments/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Payment ID
 * @param {Object} res - Express response object
 * 
 * @returns {200} Payment detail berhasil diambil
 * @returns {Object} Payment object dengan semua detail
 * 
 * @throws {404} Payment tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * GET /api/payments/8
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id_payment": 8,
 *     "id_booking": 12,
 *     "status_payment": "pending",
 *     "metode": null,
 *     "bukti_transfer": "uploads/payments/payment_20240616_102345.jpg",
 *     "catatan_admin": null,
 *     "created_at": "2024-06-16T10:23:45Z",
 *     "updated_at": "2024-06-16T10:23:45Z"
 *   }
 * }
 * 
 * @note
 * - Admin gunakan endpoint ini untuk review bukti transfer sebelum verifikasi
 * - catatan_admin hanya ada jika payment sudah diverifikasi atau ditolak
 */
const getPaymentById = async (req, res) => {
  try {
    const payment = await PaymentModel.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment tidak ditemukan.' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil payment berdasarkan booking ID
 * @async
 * @route GET /api/payments/booking/:id_booking
 * @param {Object} req - Express request object
 * @param {string} req.params.id_booking - ID Booking
 * @param {Object} req.user - User dari JWT
 * @param {Object} res - Express response object
 * @returns {200} Payment detail atau null jika belum ada
 * @throws {404} Payment belum ada untuk booking ini
 * @throws {500} Server error
 */
const getPaymentByBookingId = async (req, res) => {
  try {
    const payment = await PaymentModel.findByBookingId(req.params.id_booking);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment belum ada untuk booking ini.' });

    // Customer hanya boleh lihat payment milik booking-nya sendiri
    if (req.user.role === 'customer') {
      const BookingModel = require('../models/booking.model');
      const booking = await BookingModel.findById(payment.id_booking);
      if (!booking || booking.id_user !== req.user.id_user) {
        return res.status(403).json({ success: false, message: 'Akses ditolak.' });
      }
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Verifikasi atau tolak payment (admin)
 * 
 * @description
 * Admin mengverifikasi bukti pembayaran yang dikirim customer.
 * Ada 2 kemungkinan action:
 * 1. VERIFIED: Admin menerima bukti pembayaran. Sistem akan:
 *    - Ubah status payment jadi 'verified'
 *    - Simpan metode pembayaran (misal: "BCA Transfer", "OVO", etc)
 *    - Otomatis update booking status jadi 'confirmed'
 * 2. REJECTED: Admin menolak bukti pembayaran dengan alasan. Sistem akan:
 *    - Ubah status payment jadi 'rejected'
 *    - Simpan catatan penolakan (wajib)
 *    - Customer bisa upload bukti lain
 * 
 * @async
 * @route PUT /api/payments/verify/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Payment ID yang akan diverifikasi
 * @param {Object} req.body - Request body
 * @param {string} req.body.status_payment - Status baru (verified/rejected)
 * @param {string} [req.body.catatan_admin] - Catatan (wajib jika rejected)
 * @param {Object} res - Express response object
 * 
 * @returns {200} Payment berhasil diverifikasi
 * @returns {Object} { success: true, message: '...' }
 * 
 * @throws {400}
 *         - Status tidak valid (bukan 'verified' atau 'rejected')
 *         - Status 'rejected' tanpa catatan_admin
 * @throws {404} Payment tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * PUT /api/payments/verify/8
 * Content-Type: application/json
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * {
 *   "status_payment": "verified",
 *   "catatan_admin": "Bukti transfer valid. Transfer dari BCA berhasil diterima."
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Pembayaran berhasil diverifikasi."
 * }
 * 
 * @example
 * PUT /api/payments/verify/9 (Reject case)
 * 
 * {
 *   "status_payment": "rejected",
 *   "catatan_admin": "Nominal transfer tidak sesuai dengan booking price. Mohon ulang transfer dengan nominal yang benar: Rp 1.500.000"
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Pembayaran berhasil ditolak."
 * }
 * 
 * Response 400 (missing catatan):
 * {
 *   "success": false,
 *   "message": "Catatan penolakan wajib diisi."
 * }
 * 
 * @note
 * - Verified payment akan trigger booking confirmation otomatis
 * - Rejected payment bisa di-upload ulang oleh customer
 * - Catatan admin harus jelas untuk transparency ke customer
 * - Verifikasi akan send email notification ke customer
 * 
 * @todo
 * - Implement auto-verification based on transfer amount matching
 * - Add metode field validation (dropdown dari predefined metode)
 * - Send SMS notification ke customer saat payment verified/rejected
 * - Add approval workflow (level 1 & level 2 verification)
 */
const verifyPayment = async (req, res) => {
  try {
    const { status_payment, catatan_admin } = req.body;
    const validStatus = ['verified', 'rejected'];
    if (!validStatus.includes(status_payment)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid. Gunakan "verified" atau "rejected".' });
    }

    // Validasi: jika reject, catatan_admin wajib
    if (status_payment === 'rejected' && !catatan_admin) {
      return res.status(400).json({ success: false, message: 'Catatan penolakan wajib diisi.' });
    }
    const payment = await PaymentModel.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment tidak ditemukan.' });

    // Cek payment masih pending sebelum diproses
    if (payment.status_payment !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Pembayaran sudah dalam status "${payment.status_payment}", tidak dapat diproses ulang.`,
      });
    }

    // Jika verified dan tipe_pembayaran === 'lunas', set metode pembayaran otomatis ke 'qris'
    const updateData = { status_payment, catatan_admin: catatan_admin || null };
    if (status_payment === 'verified' && payment.tipe_pembayaran === 'lunas') {
      updateData.metode = 'qris';
    }

    await PaymentModel.verify(req.params.id, updateData);

    // Jika pembayaran diverifikasi, konfirmasi booking otomatis
    if (status_payment === 'verified') {
      await BookingModel.updateStatus(payment.id_booking, 'confirmed');
    }
    res.json({
      success: true,
      message: `Pembayaran berhasil ${status_payment === 'verified' ? 'diverifikasi' : 'ditolak'}.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { uploadPayment, getAllPayments, getPaymentById, getPaymentByBookingId, verifyPayment };

