const BookingModel = require('../models/booking.model');
const StudioModel  = require('../models/studio.model');

/**
 * Buat booking studio baru
 * @async
 * @route POST /api/bookings
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {number} req.body.id_studio - ID studio yang akan dipesan
 * @param {string} req.body.tanggal - Tanggal booking (YYYY-MM-DD atau ISO format)
 * @param {string} req.body.jam_mulai - Jam mulai (HH:mm format)
 * @param {string} req.body.jam_selesai - Jam selesai (HH:mm format)
 * @param {string} [req.body.catatan] - Catatan tambahan (opsional)
 * @param {Object} req.user - User object dari JWT token
 * @param {number} req.user.id_user - ID user yang booking
 * @param {Object} res - Express response object
 * @returns {201} Booking berhasil dibuat
 * @returns {Object} { success: true, data: Booking }
 * @throws {400} Jika field wajib kosong atau data invalid
 * @throws {404} Studio tidak ditemukan
 * @throws {409} Jadwal sudah dipesan
 * @throws {500} Server error
 * @requires customer
 */
const createBooking = async (req, res) => {
  try {
    const { id_studio, tanggal, jam_mulai, jam_selesai, catatan } = req.body;
    const id_user = req.user.id_user;

    // Validasi input
    if (!id_studio || !tanggal || !jam_mulai || !jam_selesai) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
    }

    // Normalize tanggal ke format YYYY-MM-DD (ambil bagian tanggal aja, tanpa konversi timezone)
    // Jika input sudah format YYYY-MM-DD, gunakan as-is
    // Jika ada 'T' (ISO format), ambil bagian sebelum T
    const normalizedDate = (tanggal && tanggal.includes ? tanggal.split('T')[0] : tanggal);
    
    // DEBUG: Log tanggal yang diterima
    console.log(`[DEBUG] createBooking - Input tanggal: "${tanggal}", Normalized: "${normalizedDate}"`);
    
    // Validasi jam
    if (jam_mulai >= jam_selesai) {
      return res.status(400).json({ success: false, message: 'Jam mulai harus lebih awal dari jam selesai.' });
    }

    // Validasi tanggal tidak di masa lalu (gunakan string comparison)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    console.log(`[DEBUG] createBooking - Today: "${today}", Checking: "${normalizedDate}" < "${today}" ? ${normalizedDate < today}`);
    if (normalizedDate < today) {
      return res.status(400).json({ success: false, message: 'Tanggal booking tidak boleh di masa lalu.' });
    }

    // Cek studio tersedia
    const studio = await StudioModel.findById(id_studio);
    if (!studio) {
      return res.status(404).json({ success: false, message: 'Studio tidak ditemukan.' });
    }
    if (studio.status !== 'aktif') {
      return res.status(400).json({ success: false, message: 'Studio tidak tersedia saat ini.' });
    }

    // ⚡ Cek bentrok jadwal (gunakan tanggal ternormalisasi)
    const isAvailable = await BookingModel.isScheduleAvailable(id_studio, normalizedDate, jam_mulai, jam_selesai);
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Jadwal yang dipilih sudah dipesan. Silakan pilih jam yang lain.',
      });
    }

    // Hitung total harga
    const jamMulaiNum   = parseFloat(jam_mulai.split(':')[0])   + parseFloat(jam_mulai.split(':')[1])   / 60;
    const jamSelesaiNum = parseFloat(jam_selesai.split(':')[0]) + parseFloat(jam_selesai.split(':')[1]) / 60;
    const durasiJam     = jamSelesaiNum - jamMulaiNum;
    const total_harga   = durasiJam * parseFloat(studio.harga_per_jam);

    console.log(`[DEBUG] createBooking - Final insert: tanggal="${normalizedDate}", jam_mulai="${jam_mulai}", jam_selesai="${jam_selesai}"`);
    
    const id_booking = await BookingModel.create({
      id_user, id_studio, tanggal: normalizedDate, jam_mulai, jam_selesai, total_harga, catatan,
    });

    const booking = await BookingModel.findById(id_booking);
    console.log(`[DEBUG] createBooking - Created booking ID ${id_booking}, stored tanggal: "${booking.tanggal}"`);

    res.status(201).json({
      success: true,
      message: 'Booking berhasil dibuat. Silakan upload bukti pembayaran.',
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil semua bookings (admin view)
 * @async
 * @route GET /api/bookings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {200} List semua bookings
 * @returns {Array} Array of Booking objects dengan detail lengkap
 * @throws {500} Server error
 * @requires admin
 */
const getAllBookings = async (req, res) => {
  try {
    const bookings = await BookingModel.findAll();
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil bookings milik user yang sedang login
 * @async
 * @route GET /api/bookings/my
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object dari JWT token
 * @param {number} req.user.id_user - ID user yang login
 * @param {Object} res - Express response object
 * @returns {200} List bookings milik user
 * @returns {Array} Array of Booking objects
 * @throws {500} Server error
 * @requires customer
 */
const getMyBookings = async (req, res) => {
  try {
    const bookings = await BookingModel.findByUserId(req.user.id_user);
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil semua bookings user tertentu (admin view)
 * @async
 * @route GET /api/bookings/user/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - User ID
 * @param {Object} res - Express response object
 * @returns {200} List bookings user
 * @returns {Array} Array of Booking objects
 * @throws {500} Server error
 * @requires admin
 */
const getBookingsByUser = async (req, res) => {
  try {
    const bookings = await BookingModel.findByUserId(req.params.id);
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil detail booking tertentu
 * @async
 * @route GET /api/bookings/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Booking ID
 * @param {Object} req.user - User object dari JWT token
 * @param {Object} res - Express response object
 * @returns {200} Detail booking berhasil diambil
 * @returns {Object} Booking object
 * @throws {404} Booking tidak ditemukan
 * @throws {403} Customer tidak bisa lihat booking orang lain
 * @throws {500} Server error
 * @note Customer hanya bisa melihat booking miliknya sendiri
 */
const getBookingById = async (req, res) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan.' });

    // Customer hanya boleh lihat booking sendiri
    if (req.user.role === 'customer' && booking.id_user !== req.user.id_user) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update status booking (admin)
 * @async
 * @route PUT /api/bookings/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Booking ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.status_booking - Status baru (pending/confirmed/rejected/cancelled)
 * @param {string} [req.body.catatan_admin] - Catatan admin (wajib jika reject)
 * @param {Object} res - Express response object
 * @returns {200} Status booking berhasil diupdate
 * @returns {Object} { success: true, data: Booking }
 * @throws {400} Jika status tidak valid atau catatan kosong (untuk reject)
 * @throws {404} Booking tidak ditemukan
 * @throws {500} Server error
 * @requires admin
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { status_booking, catatan_admin } = req.body;
    const validStatus = ['pending', 'confirmed', 'rejected', 'cancelled'];
    if (!validStatus.includes(status_booking)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }

    // Validasi: jika reject, catatan_admin wajib
    if (status_booking === 'rejected' && !catatan_admin) {
      return res.status(400).json({ success: false, message: 'Catatan penolakan wajib diisi.' });
    }

    const affected = await BookingModel.updateStatus(req.params.id, status_booking, catatan_admin || null);
    if (!affected) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan.' });

    const booking = await BookingModel.findById(req.params.id);
    res.json({ success: true, message: `Status booking diubah menjadi "${status_booking}".`, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil jadwal booking pada hari tertentu (untuk calendar view)
 * @async
 * @route GET /api/bookings/schedule
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.id_studio - Studio ID
 * @param {string} req.query.tanggal - Tanggal (YYYY-MM-DD format)
 * @param {Object} res - Express response object
 * @returns {200} Jadwal pada tanggal tersebut
 * @returns {Array} Array of bookings pada tanggal tersebut
 * @throws {400} Jika id_studio atau tanggal kosong
 * @throws {500} Server error
 * @public
 */
const getSchedule = async (req, res) => {
  try {
    const { id_studio, tanggal } = req.query;
    if (!id_studio || !tanggal) {
      return res.status(400).json({ success: false, message: 'id_studio dan tanggal wajib diisi.' });
    }
    // Normalize tanggal ke format YYYY-MM-DD (ambil bagian tanggal aja, tanpa konversi timezone)
    const normalizedDate = tanggal.split('T')[0]
    const schedule = await BookingModel.getScheduleByStudioAndDate(id_studio, normalizedDate);
    res.json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil jadwal booking seluruh bulan (untuk calendar view bulanan)
 * @async
 * @route GET /api/bookings/schedule/month
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.id_studio - Studio ID
 * @param {number} req.query.year - Tahun (YYYY format)
 * @param {number} req.query.month - Bulan (1-12)
 * @param {Object} res - Express response object
 * @returns {200} Jadwal seluruh bulan
 * @returns {Array} Array of bookings dalam bulan tersebut
 * @throws {400} Jika id_studio, year, atau month kosong
 * @throws {500} Server error
 * @public
 */
const getScheduleByMonth = async (req, res) => {
  try {
    const { id_studio, year, month } = req.query;
    if (!id_studio || !year || !month) {
      return res.status(400).json({ success: false, message: 'id_studio, year, dan month wajib diisi.' });
    }
    const schedule = await BookingModel.getScheduleByStudioAndMonth(id_studio, year, month);
    res.json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Customer membatalkan booking studio
 * @async
 * @route PUT /api/bookings/:id/cancel
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Booking ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.catatan_cancel - Alasan pembatalan
 * @param {Object} req.user - User object dari JWT token
 * @param {number} req.user.id_user - ID user yang login
 * @param {Object} res - Express response object
 * @returns {200} Booking berhasil dibatalkan
 * @returns {Object} { success: true, message: string }
 * @throws {400} Jika catatan kosong atau status booking tidak bisa dibatalkan
 * @throws {403} Jika customer mencoba membatalkan booking milik orang lain
 * @throws {404} Booking tidak ditemukan
 * @throws {500} Server error
 * @requires customer
 */
const cancelBooking = async (req, res) => {
  try {
    const { catatan_cancel } = req.body;
    const id_booking = req.params.id;
    const id_user = req.user.id_user;

    if (!catatan_cancel || !catatan_cancel.trim()) {
      return res.status(400).json({ success: false, message: 'Catatan pembatalan wajib diisi.' });
    }

    // Cek booking milik user ini
    const booking = await BookingModel.findById(id_booking);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan.' });
    if (booking.id_user !== id_user) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    // Cek status booking - hanya pending/confirmed yang bisa di-cancel
    if (!['pending', 'confirmed'].includes(booking.status_booking)) {
      return res.status(400).json({ success: false, message: `Booking dengan status ${booking.status_booking} tidak bisa dibatalkan.` });
    }

    const affected = await BookingModel.cancelBooking(id_booking, catatan_cancel);
    if (!affected) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan.' });

    res.json({ success: true, message: 'Booking berhasil dibatalkan.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Admin menandai booking sebagai lunas dengan metode pembayaran
 * @async
 * @route PUT /api/bookings/:id/payment
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Booking ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.status_payment - Status pembayaran (pending/verified/rejected)
 * @param {string} req.body.metode - Metode pembayaran (qris/cash)
 * @param {Object} res - Express response object
 * @returns {200} Pembayaran booking berhasil diperbarui
 * @returns {Object} { success: true, message: string, data: Booking }
 * @throws {400} Jika parameter tidak valid atau kosong
 * @throws {404} Booking tidak ditemukan
 * @throws {500} Server error
 * @requires admin
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const PaymentModel = require('../models/payment.model');
    const { status_payment, metode } = req.body;
    const id_booking = req.params.id;

    console.log('[DEBUG] updatePaymentStatus called', { id_booking, status_payment, metode });

    // Validasi input
    if (!status_payment || !metode) {
      console.log('[DEBUG] Validation failed - missing status_payment or metode');
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

    // Cek booking exists
    const booking = await BookingModel.findById(id_booking);
    if (!booking) {
      console.log('[DEBUG] Booking not found:', id_booking);
      return res.status(404).json({ success: false, message: 'Booking tidak ditemukan.' });
    }

    console.log('[DEBUG] Booking found:', { id_booking, status: booking.status_booking });

    // Update atau create payment
    const db = require('../config/database');
    
    // Cek apakah payment sudah ada
    const [existingPayment] = await db.query(
      'SELECT id_payment FROM payments WHERE id_booking = ?',
      [id_booking]
    );

    console.log('[DEBUG] Existing payment check:', { exists: existingPayment.length > 0 });

    if (existingPayment.length > 0) {
      // Update existing payment
      console.log('[DEBUG] Updating existing payment');
      await db.query(
        'UPDATE payments SET status_payment = ?, metode = ? WHERE id_booking = ?',
        [status_payment, metode, id_booking]
      );
    } else {
      // Create new payment
      console.log('[DEBUG] Creating new payment');
      await db.query(
        'INSERT INTO payments (id_booking, metode, status_payment) VALUES (?, ?, ?)',
        [id_booking, metode, status_payment]
      );
    }

    const updatedBooking = await BookingModel.findById(id_booking);
    console.log('[DEBUG] Payment updated successfully', { id_booking, metode });
    
    res.json({ 
      success: true, 
      message: `Booking ditandai sebagai lunas dengan metode ${metode.toUpperCase()}.`, 
      data: updatedBooking 
    });
  } catch (err) {
    console.error('[ERROR] updatePaymentStatus error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getMyBookings,
  getBookingsByUser,
  getBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  cancelBooking,
  getSchedule,
  getScheduleByMonth,
};
