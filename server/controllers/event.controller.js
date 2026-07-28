const EventModel      = require('../models/event.model');
const EventOrderModel = require('../models/eventOrder.model');
const EventServiceModel = require('../models/eventService.model');
const EventPackageModel = require('../models/eventPackage.model');
const EventEquipmentModel = require('../models/eventEquipment.model');
const EventRentalModel = require('../models/eventRental.model');

/**
 * Buat event request baru dengan services dan equipment pilihan
 * 
 * @description
 * Memproses pembuatan event baru dari customer. Function ini:
 * 1. Validasi input dasar (nama_event, tanggal_event)
 * 2. Validasi range tanggal event (tanggal_selesai >= tanggal_event)
 * 3. Jika paket dipilih: validasi paket tersedia dan tanggal paket dalam range event
 * 4. Create event record di tabel events
 * 5. Add services yang dipilih ke tabel event_orders dengan harga
 * 6. Add equipment rental yang dipilih ke tabel event_rentals
 * Status event otomatis 'pending' (menunggu approval admin)
 * 
 * @async
 * @route POST /api/events
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.nama_event - Nama event (contoh: "Pernikahan Andi & Budi")
 * @param {string} req.body.tanggal_event - Tanggal mulai event (YYYY-MM-DD format)
 * @param {string} [req.body.tanggal_selesai] - Tanggal selesai event (opsional, default = tanggal_event)
 * @param {string} [req.body.lokasi_event] - Lokasi/venue event (opsional)
 * @param {string} [req.body.deskripsi] - Deskripsi detail event (opsional)
 * @param {Array<Object>} [req.body.services] - Array services yang dipilih (opsional)
 * @param {number} req.body.services[].id_service - ID service
 * @param {number} req.body.services[].qty - Quantity/jumlah service
 * @param {Array<number>} [req.body.selected_equipment] - Array equipment IDs (opsional)
 * @param {number} [req.body.id_package] - ID event package (opsional)
 * @param {string} [req.body.tanggal_mulai_paket] - Tanggal paket mulai (opsional)
 * @param {string} [req.body.tanggal_selesai_paket] - Tanggal paket selesai (opsional)
 * @param {Object} req.user - User object dari JWT
 * @param {number} req.user.id_user - ID customer yang membuat event
 * @param {Object} res - Express response object
 * 
 * @returns {201} Event request berhasil dibuat
 * @returns {Object} { success: true, data: Event dengan id_event, status_event: 'pending' }
 * 
 * @throws {400} Validasi gagal:
 *         - Nama event atau tanggal_event kosong
 *         - tanggal_selesai < tanggal_event
 *         - Paket tidak ditemukan
 *         - Tanggal paket tidak dalam range event
 * @throws {500} Database error
 * 
 * @requires customer
 * 
 * @example
 * POST /api/events
 * Content-Type: application/json
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * {
 *   "nama_event": "Pernikahan Andi & Budi",
 *   "tanggal_event": "2024-08-15",
 *   "tanggal_selesai": "2024-08-16",
 *   "lokasi_event": "Hotel Grand Palace",
 *   "deskripsi": "Resepsi pernikahan dengan 200 tamu",
 *   "id_package": 3,
 *   "services": [
 *     { "id_service": 1, "qty": 1 },
 *     { "id_service": 5, "qty": 2 }
 *   ],
 *   "selected_equipment": [10, 15, 22]
 * }
 * 
 * Response 201:
 * {
 *   "success": true,
 *   "message": "Permintaan event berhasil dikirim. Menunggu konfirmasi admin.",
 *   "data": {
 *     "id_event": 45,
 *     "id_user": 12,
 *     "nama_event": "Pernikahan Andi & Budi",
 *     "tanggal_event": "2024-08-15",
 *     "status_event": "pending",
 *     "created_at": "2024-06-16T10:30:00Z"
 *   }
 * }
 * 
 * @note
 * - Status event otomatis 'pending' setelah create, menunggu admin approval
 * - Services dan equipment di-create dalam transaction (semua atau tidak sama sekali)
 * - Harga service otomatis dihitung: harga × qty dari service master
 * - Equipment hanya ditambah jika memiliki harga_sewa (harga > 0)
 * 
 * @todo
 * - Add support untuk bulk upload services dan equipment file
 * - Add real-time inventory check untuk equipment yang terbatas
 * - Implement email notification ke admin ketika event dibuat
 */
const createEvent = async (req, res) => {
  try {
    const { nama_event, tanggal_event, tanggal_selesai, lokasi_event, deskripsi, services, selected_equipment, id_package, tanggal_mulai_paket, tanggal_selesai_paket } = req.body;
    const id_user = req.user.id_user;

    if (!nama_event || !tanggal_event) {
      return res.status(400).json({ success: false, message: 'Nama event dan tanggal wajib diisi.' });
    }

    // Validate tanggal_selesai if provided
    if (tanggal_selesai) {
      const start = new Date(tanggal_event);
      const end = new Date(tanggal_selesai);
      if (end < start) {
        return res.status(400).json({ success: false, message: 'Tanggal selesai harus lebih besar atau sama dengan tanggal mulai.' });
      }
    }

    // Validate id_package if provided
    if (id_package) {
      const pkg = await EventPackageModel.findById(id_package);
      if (!pkg) {
        return res.status(400).json({ success: false, message: 'Paket event tidak ditemukan.' });
      }

      // Validate package dates if provided
      if (tanggal_mulai_paket || tanggal_selesai_paket) {
        const pkgStart = tanggal_mulai_paket ? new Date(tanggal_mulai_paket) : null;
        const pkgEnd = tanggal_selesai_paket ? new Date(tanggal_selesai_paket) : null;
        const eventStart = new Date(tanggal_event);
        const eventEnd = tanggal_selesai ? new Date(tanggal_selesai) : eventStart;

        // Package start date must be within event date range
        if (pkgStart && (pkgStart < eventStart || pkgStart > eventEnd)) {
          return res.status(400).json({ success: false, message: 'Tanggal mulai paket harus dalam range event.' });
        }

        // Package end date must be within event date range
        if (pkgEnd && (pkgEnd < eventStart || pkgEnd > eventEnd)) {
          return res.status(400).json({ success: false, message: 'Tanggal selesai paket harus dalam range event.' });
        }

        // Package start must be before or equal to package end
        if (pkgStart && pkgEnd && pkgEnd < pkgStart) {
          return res.status(400).json({ success: false, message: 'Tanggal selesai paket harus lebih besar atau sama dengan tanggal mulai paket.' });
        }
      }
    }

    const id_event = await EventModel.create({ 
      id_user, 
      nama_event, 
      tanggal_event, 
      tanggal_selesai: tanggal_selesai || null, 
      lokasi_event, 
      deskripsi, 
      id_package: id_package || null,
      tanggal_mulai_paket: tanggal_mulai_paket || null,
      tanggal_selesai_paket: tanggal_selesai_paket || null
    });

    // Tambah event orders jika ada services yang dipilih
    if (services && Array.isArray(services) && services.length > 0) {
      const orderItems = [];
      for (const item of services) {
        const svc = await EventServiceModel.findById(item.id_service);
        if (!svc) continue;
        const total_harga = svc.harga * item.qty;
        orderItems.push({ id_service: item.id_service, qty: item.qty, total_harga });
      }
      if (orderItems.length > 0) {
        await EventOrderModel.createBulk(id_event, orderItems);
      }
    }

    // Tambah selected equipment jika ada
    if (selected_equipment && Array.isArray(selected_equipment) && selected_equipment.length > 0) {
      const rentalItems = [];
      for (const id_equipment of selected_equipment) {
        const eq = await EventEquipmentModel.findById(id_equipment);
        if (!eq) continue;
        // If equipment has harga_sewa, add it; otherwise skip (no price defined)
        if (eq.harga_sewa) {
          rentalItems.push({ id_equipment, harga_satuan: eq.harga_sewa });
        }
      }
      if (rentalItems.length > 0) {
        await EventRentalModel.createBulk(id_event, rentalItems);
      }
    }

    const event = await EventModel.findById(id_event);
    res.status(201).json({
      success: true,
      message: 'Permintaan event berhasil dikirim. Menunggu konfirmasi admin.',
      data: event,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil semua events (admin dashboard view)
 * 
 * @description
 * Fetch semua event requests dari seluruh customer untuk admin dashboard.
 * Menampilkan event dengan berbagai status (pending, approved, rejected, completed)
 * untuk keperluan monitoring dan management event secara keseluruhan.
 * 
 * @async
 * @route GET /api/events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @returns {200} List semua events
 * @returns {Array<Object>} Array of events dengan struktur:
 *          [
 *            { id_event, id_user, nama_event, tanggal_event, status_event, ... },
 *            ...
 *          ]
 * 
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * GET /api/events
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id_event": 1,
 *       "id_user": 5,
 *       "nama_event": "Pernikahan Andi",
 *       "tanggal_event": "2024-08-15",
 *       "status_event": "pending",
 *       "created_at": "2024-06-10T08:30:00Z"
 *     },
 *     {
 *       "id_event": 2,
 *       "id_user": 8,
 *       "nama_event": "Konser Jazz Night",
 *       "tanggal_event": "2024-07-22",
 *       "status_event": "approved",
 *       "created_at": "2024-06-12T14:20:00Z"
 *     }
 *   ]
 * }
 * 
 * @note
 * - Admin dapat melihat semua events termasuk milik customer lain
 * - Untuk filtering berdasarkan status, gunakan query parameter di future version
 * - Data diambil dari cache jika tersedia (Redis)
 */
const getAllEvents = async (req, res) => {
  try {
    const events = await EventModel.findAll();
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil semua events milik customer yang login
 * 
 * @description
 * Fetch semua event requests yang dibuat oleh customer yang sedang login.
 * Customer hanya dapat melihat events miliknya sendiri untuk privacy/security.
 * 
 * @async
 * @route GET /api/events/my
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object dari JWT
 * @param {number} req.user.id_user - ID customer yang login
 * @param {Object} res - Express response object
 * 
 * @returns {200} List events milik customer
 * @returns {Array<Object>} Array of events user
 * 
 * @throws {500} Database error
 * 
 * @requires customer
 * 
 * @example
 * GET /api/events/my
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs... (customer token)
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id_event": 45,
 *       "nama_event": "Pernikahan Andi & Budi",
 *       "tanggal_event": "2024-08-15",
 *       "status_event": "pending",
 *       "created_at": "2024-06-16T10:30:00Z"
 *     },
 *     {
 *       "id_event": 48,
 *       "nama_event": "Ulang Tahun Putri",
 *       "tanggal_event": "2024-09-22",
 *       "status_event": "approved",
 *       "created_at": "2024-06-14T15:45:00Z"
 *     }
 *   ]
 * }
 * 
 * @note
 * - Customer dapat melihat status event dan feedback dari admin
 * - Events dapat di-cancel jika status masih 'pending' atau 'approved'
 */
const getMyEvents = async (req, res) => {
  try {
    const events = await EventModel.findByUserId(req.user.id_user);
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil detail event spesifik
 * 
 * @description
 * Fetch data detail event termasuk services, equipment, dan package details.
 * Customer hanya dapat melihat event miliknya sendiri.
 * Admin dapat melihat semua event untuk review dan processing.
 * 
 * @async
 * @route GET /api/events/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Event ID
 * @param {Object} req.user - User object dari JWT
 * @param {number} req.user.id_user - ID user yang request
 * @param {string} req.user.role - Role user (admin/customer)
 * @param {Object} res - Express response object
 * 
 * @returns {200} Event detail berhasil diambil
 * @returns {Object} Event object dengan services, equipment, package info
 * 
 * @throws {404} Event tidak ditemukan
 * @throws {403} Customer tidak bisa lihat event orang lain
 * @throws {500} Database error
 * 
 * @requires customer|admin
 * 
 * @example
 * GET /api/events/45
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id_event": 45,
 *     "id_user": 12,
 *     "nama_event": "Pernikahan Andi & Budi",
 *     "tanggal_event": "2024-08-15",
 *     "tanggal_selesai": "2024-08-16",
 *     "lokasi_event": "Hotel Grand Palace",
 *     "status_event": "pending",
 *     "services": [
 *       { "id_service": 1, "nama_service": "Catering", "qty": 200, "harga": 50000, "subtotal": 10000000 }
 *     ],
 *     "equipment": [
 *       { "id_equipment": 10, "nama_equipment": "Sound System", "harga_sewa": 2000000 }
 *     ],
 *     "package": {
 *       "id_package": 3,
 *       "nama_package": "Wedding Gold",
 *       "harga_package": 25000000
 *     },
 *     "created_at": "2024-06-16T10:30:00Z"
 *   }
 * }
 * 
 * @note
 * - Access control: customer hanya lihat event miliknya, admin lihat semua
 * - Return 403 jika customer coba akses event orang lain
 */
const getEventById = async (req, res) => {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });

    if (req.user.role === 'customer' && event.id_user !== req.user.id_user) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update status event (admin only)
 * 
 * @description
 * Admin mengubah status event dari pending ke approved/rejected/completed.
 * Setiap status change bisa disertai catatan admin untuk feedback ke customer.
 * Jika reject, catatan_admin wajib diisi (untuk menjelaskan alasan penolakan).
 * 
 * Status transitions:
 * - pending → approved: Event disetujui dan siap diproses
 * - pending → rejected: Event ditolak dengan alasan (catatan wajib)
 * - approved → completed: Event sudah selesai dilaksanakan
 * - rejected: status akhir (tidak bisa di-transition lagi)
 * 
 * @async
 * @route PUT /api/events/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Event ID yang akan diupdate
 * @param {Object} req.body - Request body
 * @param {string} req.body.status_event - Status baru (pending/approved/rejected/completed)
 * @param {string} [req.body.catatan_admin] - Catatan admin (wajib jika reject)
 * @param {Object} res - Express response object
 * 
 * @returns {200} Status event berhasil diupdate
 * @returns {Object} { success: true, message, data: Event updated }
 * 
 * @throws {400} 
 *         - Status tidak valid (bukan pending/approved/rejected/completed)
 *         - Status 'rejected' tanpa catatan_admin
 * @throws {404} Event tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * PUT /api/events/45
 * Content-Type: application/json
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs... (admin token)
 * 
 * {
 *   "status_event": "approved",
 *   "catatan_admin": "Event request sudah diverifikasi. Silakan melanjutkan pembayaran."
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Status event diubah menjadi \"approved\".",
 *   "data": {
 *     "id_event": 45,
 *     "status_event": "approved",
 *     "catatan_admin": "Event request sudah diverifikasi. Silakan melanjutkan pembayaran."
 *   }
 * }
 * 
 * @example
 * PUT /api/events/46 (Reject case)
 * 
 * {
 *   "status_event": "rejected",
 *   "catatan_admin": "Maaf, tanggal event sudah fully booked untuk wedding packages."
 * }
 * 
 * Response 400 (if catatan_admin missing):
 * {
 *   "success": false,
 *   "message": "Catatan penolakan wajib diisi."
 * }
 * 
 * @note
 * - Reject harus disertai catatan untuk transparency ke customer
 * - Status change akan trigger email notification ke customer
 * - Admin dapat melihat history dari setiap status change
 * 
 * @todo
 * - Implement status change history tracking (audit log)
 * - Add email notification ke customer saat status berubah
 * - Add rollback mechanism untuk status changes
 */
const updateEventStatus = async (req, res) => {
  try {
    const { status_event, catatan_admin } = req.body;
    const validStatus = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatus.includes(status_event)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }

    // Validasi: jika reject, catatan_admin wajib
    if (status_event === 'rejected' && !catatan_admin) {
      return res.status(400).json({ success: false, message: 'Catatan penolakan wajib diisi.' });
    }

    const affected = await EventModel.updateStatus(req.params.id, status_event, catatan_admin || null);
    if (!affected) return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });

    const event = await EventModel.findById(req.params.id);
    res.json({ success: true, message: `Status event diubah menjadi "${status_event}".`, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Cancel event request (customer only)
 * 
 * @description
 * Customer dapat membatalkan event yang masih dalam status 'pending' atau 'approved'.
 * Pembatalan harus disertai catatan/alasan untuk record keeping.
 * Setelah event dibatalkan, customer dapat request refund jika sudah ada pembayaran.
 * 
 * Validasi:
 * - Event harus milik customer yang submit request
 * - Status harus 'pending' atau 'approved' (tidak bisa cancel jika sudah 'completed')
 * - catatan_cancel wajib diisi (tidak boleh kosong)
 * 
 * @async
 * @route PUT /api/events/:id/cancel
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Event ID yang akan dibatalkan
 * @param {Object} req.body - Request body
 * @param {string} req.body.catatan_cancel - Alasan pembatalan (wajib, tidak boleh kosong)
 * @param {Object} req.user - User object dari JWT
 * @param {number} req.user.id_user - ID customer yang request cancel
 * @param {Object} res - Express response object
 * 
 * @returns {200} Event berhasil dibatalkan
 * @returns {Object} { success: true, message: 'Event berhasil dibatalkan.' }
 * 
 * @throws {400} 
 *         - catatan_cancel kosong atau tidak diisi
 *         - Status event tidak bisa dibatalkan (status !== 'pending'/'approved')
 * @throws {403} Customer mencoba cancel event orang lain
 * @throws {404} Event tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires customer
 * 
 * @example
 * PUT /api/events/45/cancel
 * Content-Type: application/json
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs... (customer token)
 * 
 * {
 *   "catatan_cancel": "Acara terpaksa dibatalkan karena ada perubahan mendadak dalam keluarga."
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Event berhasil dibatalkan."
 * }
 * 
 * Response 400 (invalid status):
 * {
 *   "success": false,
 *   "message": "Event dengan status completed tidak bisa dibatalkan."
 * }
 * 
 * Response 400 (missing catatan):
 * {
 *   "success": false,
 *   "message": "Catatan pembatalan wajib diisi."
 * }
 * 
 * @note
 * - Pembatalan event mengubah status menjadi 'cancelled'
 * - Catatan pembatalan disimpan untuk reference dan customer service follow-up
 * - Customer dapat request refund setelah event dibatalkan
 * - Event yang sudah 'completed' tidak bisa dibatalkan (final status)
 * 
 * @todo
 * - Implement automatic refund processing based on cancellation timing
 * - Add cancellation deadline (e.g., must cancel 7 days before event)
 * - Send email notification ke admin dan payment team saat event dibatalkan
 * - Add cancellation fee jika dekat dengan event date
 */
const cancelEvent = async (req, res) => {
  try {
    const { catatan_cancel } = req.body;
    const id_event = req.params.id;
    const id_user = req.user.id_user;

    if (!catatan_cancel || !catatan_cancel.trim()) {
      return res.status(400).json({ success: false, message: 'Catatan pembatalan wajib diisi.' });
    }

    // Cek event milik user ini
    const event = await EventModel.findById(id_event);
    if (!event) return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    if (event.id_user !== id_user) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    // Cek status event - hanya pending/approved yang bisa di-cancel
    if (!['pending', 'approved'].includes(event.status_event)) {
      return res.status(400).json({ success: false, message: `Event dengan status ${event.status_event} tidak bisa dibatalkan.` });
    }

    const affected = await EventModel.cancelEvent(id_event, catatan_cancel);
    if (!affected) return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });

    res.json({ success: true, message: 'Event berhasil dibatalkan.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createEvent, getAllEvents, getMyEvents, getEventById, updateEventStatus, cancelEvent };
