import api from './api'

/**
 * @module services/auth
 * @description Service untuk autentikasi user (register, login, get current profile)
 */
export const authService = {
  /**
   * Registrasi customer baru
   * @param {Object} data - Form data registrasi (email, password, nama, no_hp)
   * @returns {Promise<Object>} Response data
   */
  register: (data) => api.post('/auth/register', data),

  /**
   * Login user
   * @param {Object} data - Credentials (email, password)
   * @returns {Promise<Object>} Response data berisi token dan data user
   */
  login:    (data) => api.post('/auth/login', data),

  /**
   * Ambil data user yang sedang login berdasarkan token
   * @returns {Promise<Object>} Detail user profile
   */
  getMe:    ()     => api.get('/auth/me'),
}

/**
 * @module services/studio
 * @description Service untuk pengelolaan data studio musik (CRUD dan upload gambar)
 */
export const studioService = {
  /**
   * Ambil seluruh studio
   * @param {string} [status] - Filter status studio ('aktif', 'nonaktif')
   * @returns {Promise<Object>} List studio
   */
  getAll:    (status) => api.get('/studios', { params: { status } }),

  /**
   * Ambil detail studio berdasarkan ID
   * @param {number} id - ID Studio
   * @returns {Promise<Object>} Detail studio
   */
  getById:   (id)     => api.get(`/studios/${id}`),

  /**
   * Buat studio baru (Admin)
   * @param {Object} data - Data studio (nama_studio, tipe, harga_per_jam, deskripsi)
   * @returns {Promise<Object>} Studio yang baru dibuat
   */
  create:    (data)   => api.post('/studios', data),

  /**
   * Update data studio (Admin)
   * @param {number} id - ID Studio
   * @param {Object} data - Data studio terupdate
   * @returns {Promise<Object>} Hasil update
   */
  update:    (id, data) => api.put(`/studios/${id}`, data),

  /**
   * Upload foto studio (Admin)
   * @param {number} id - ID Studio
   * @param {FormData} formData - Multipart form data berisi file gambar
   * @returns {Promise<Object>} Path gambar yang disimpan
   */
  uploadGambar: (id, formData) => api.post(`/studios/${id}/upload-gambar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  /**
   * Hapus studio (Admin)
   * @param {number} id - ID Studio
   * @returns {Promise<Object>} Status penghapusan
   */
  delete:    (id)     => api.delete(`/studios/${id}`),
}

/**
 * @module services/booking
 * @description Service untuk pengelolaan pesanan/booking studio
 */
export const bookingService = {
  /**
   * Buat booking studio baru
   * @param {Object} data - Data booking (id_studio, tanggal, jam_mulai, jam_selesai, catatan)
   * @returns {Promise<Object>} Data booking yang dibuat
   */
  create:          (data)                            => api.post('/bookings', data),

  /**
   * Ambil seluruh booking (Admin)
   * @returns {Promise<Object>} List seluruh booking
   */
  getAll:          ()                                => api.get('/bookings'),

  /**
   * Ambil booking milik user yang sedang login
   * @returns {Promise<Object>} List booking customer
   */
  getMy:           ()                                => api.get('/bookings/my'),

  /**
   * Ambil detail booking berdasarkan ID
   * @param {number} id - ID Booking
   * @returns {Promise<Object>} Detail booking
   */
  getById:         (id)                              => api.get(`/bookings/${id}`),

  /**
   * Ambil booking milik user tertentu (Admin)
   * @param {number} userId - ID User
   * @returns {Promise<Object>} List booking user
   */
  getByUser:       (userId)                          => api.get(`/bookings/user/${userId}`),

  /**
   * Update status booking (Admin)
   * @param {number} id - ID Booking
   * @param {string} status_booking - Status baru ('approved', 'rejected', 'completed')
   * @param {string} [catatan_admin] - Catatan atau alasan admin
   * @returns {Promise<Object>} Hasil update
   */
  updateStatus:    (id, status_booking, catatan_admin) => api.put(`/bookings/${id}`, { status_booking, catatan_admin }),

  /**
   * Update status pembayaran booking (Admin)
   * @param {number} id - ID Booking
   * @param {string} status_payment - Status baru ('paid', 'unpaid')
   * @param {string} [metode] - Metode pembayaran (misal: 'Transfer')
   * @returns {Promise<Object>} Hasil update
   */
  updatePaymentStatus: (id, status_payment, metode) => api.put(`/bookings/${id}/payment`, { status_payment, metode }),

  /**
   * Batalkan booking oleh customer
   * @param {number} id - ID Booking
   * @param {string} [catatan_cancel] - Alasan pembatalan
   * @returns {Promise<Object>} Hasil pembatalan
   */
  cancel:          (id, catatan_cancel)              => api.put(`/bookings/${id}/cancel`, { catatan_cancel }),

  /**
   * Ambil jadwal booking studio pada tanggal tertentu
   * @param {number} id_studio - ID Studio
   * @param {string} tanggal - Tanggal booking (YYYY-MM-DD)
   * @returns {Promise<Object>} List jadwal studio
   */
  getSchedule:     (id_studio, tanggal)              => api.get('/bookings/schedule', { params: { id_studio, tanggal } }),

  /**
   * Ambil jadwal booking studio dalam satu bulan
   * @param {number} id_studio - ID Studio
   * @param {number} year - Tahun (YYYY)
   * @param {number} month - Bulan (1-12)
   * @returns {Promise<Object>} List jadwal bulanan
   */
  getScheduleMonth:(id_studio, year, month)          => api.get('/bookings/schedule/month', { params: { id_studio, year, month } }),
}

/**
 * @module services/payment
 * @description Service untuk transaksi bukti pembayaran booking studio
 */
export const paymentService = {
  /**
   * Upload bukti transfer pembayaran booking
   * @param {FormData} formData - Form data berisi id_booking, jumlah_bayar, bukti_transfer
   * @returns {Promise<Object>} Status upload
   */
  upload:   (formData) => api.post('/payments', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  /**
   * Ambil semua data transaksi pembayaran booking (Admin)
   * @returns {Promise<Object>} List pembayaran
   */
  getAll:   ()         => api.get('/payments'),

  /**
   * Ambil detail transaksi pembayaran berdasarkan ID payment
   * @param {number} id - ID Payment
   * @returns {Promise<Object>} Detail pembayaran
   */
  getById:  (id)       => api.get(`/payments/${id}`),

  /**
   * Ambil payment berdasarkan ID booking
   * @param {number} id_booking - ID Booking
   * @returns {Promise<Object>} Detail pembayaran booking tersebut
   */
  getByBookingId: (id_booking) => api.get(`/payments/booking/${id_booking}`),

  /**
   * Verifikasi pembayaran booking studio (Admin)
   * @param {number} id - ID Payment
   * @param {Object} data - Data verifikasi (status_pembayaran: 'paid'/'rejected')
   * @returns {Promise<Object>} Hasil verifikasi
   */
  verify:   (id, data) => api.put(`/payments/verify/${id}`, data),
}

/**
 * @module services/eventPayment
 * @description Service untuk transaksi bukti pembayaran event request
 */
export const eventPaymentService = {
  /**
   * Upload bukti transfer pembayaran event (DP/Lunas)
   * @param {FormData} formData - Form data berisi id_event, jumlah_bayar, tipe_pembayaran, bukti_transfer
   * @returns {Promise<Object>} Status upload
   */
  upload:   (formData) => api.post('/event-payments', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  /**
   * Ambil semua transaksi pembayaran event (Admin)
   * @returns {Promise<Object>} List pembayaran event
   */
  getAll:   ()         => api.get('/event-payments'),

  /**
   * Ambil detail pembayaran event
   * @param {number} id - ID Event Payment
   * @returns {Promise<Object>} Detail pembayaran event
   */
  getById:  (id)       => api.get(`/event-payments/${id}`),

  /**
   * Ambil payment berdasarkan ID event (untuk admin detail & customer status)
   * @param {number} id_event - ID Event
   * @returns {Promise<Object>} Detail pembayaran DP atau 404 jika belum ada
   */
  getByEventId: (id_event) => api.get(`/event-payments/event/${id_event}`),

  /**
   * Verifikasi pembayaran event (Admin)
   * @param {number} id - ID Event Payment
   * @param {Object} data - Data verifikasi (status_payment: 'verified'/'rejected')
   * @returns {Promise<Object>} Hasil verifikasi
   */
  verify:   (id, data) => api.put(`/event-payments/verify/${id}`, data),

  /**
   * Update status pembayaran event (Admin manual lunas)
   * @param {number} id_event - ID Event
   * @param {string} status_payment - Status baru ('verified', etc)
   * @param {string} metode - Metode pembayaran ('cash'/'qris')
   * @returns {Promise<Object>} Hasil update
   */
  updatePaymentStatus: (id_event, status_payment, metode) => api.put(`/event-payments/event/${id_event}/payment`, { status_payment, metode }),
}


/**
 * @module services/event
 * @description Service untuk pemesanan event request
 */
export const eventService = {
  /**
   * Ajukan request event baru beserta service/alat tambahan
   * @param {Object} data - Form data event
   * @returns {Promise<Object>} Data event yang dibuat
   */
  create:       (data) => api.post('/events', data),

  /**
   * Ambil seluruh request event (Admin)
   * @returns {Promise<Object>} List request event
   */
  getAll:       ()     => api.get('/events'),

  /**
   * Ambil request event milik user yang sedang login
   * @returns {Promise<Object>} List event customer
   */
  getMy:        ()     => api.get('/events/my'),

  /**
   * Ambil detail request event lengkap beserta sub-orders
   * @param {number} id - ID Event
   * @returns {Promise<Object>} Detail event
   */
  getById:      (id)   => api.get(`/events/${id}`),

  /**
   * Update status event (Admin)
   * @param {number} id - ID Event
   * @param {string} status_event - Status baru ('approved', 'rejected', 'completed')
   * @param {string} [catatan_admin] - Alasan/catatan admin
   * @returns {Promise<Object>} Hasil update
   */
  updateStatus: (id, status_event, catatan_admin) => api.put(`/events/${id}`, { status_event, catatan_admin }),

  /**
   * Batalkan request event oleh customer
   * @param {number} id - ID Event
   * @param {string} [catatan_cancel] - Alasan pembatalan
   * @returns {Promise<Object>} Hasil pembatalan
   */
  cancel:       (id, catatan_cancel) => api.put(`/events/${id}/cancel`, { catatan_cancel }),
}

/**
 * @module services/eventPkg
 * @description Service untuk pengelolaan paket event (Admin & Public)
 */
export const eventPkgService = {
  /**
   * Ambil seluruh paket event
   * @returns {Promise<Object>} List paket event
   */
  getAll:  () => api.get('/event-packages'),

  /**
   * Ambil detail paket event
   * @param {number} id - ID Paket
   * @returns {Promise<Object>} Detail paket event
   */
  getById: (id) => api.get(`/event-packages/${id}`),

  /**
   * Buat paket event baru (Admin)
   * @param {Object} data - Data paket
   * @returns {Promise<Object>} Paket yang dibuat
   */
  create:  (data) => api.post('/event-packages', data),

  /**
   * Update data paket event (Admin)
   * @param {number} id - ID Paket
   * @param {Object} data - Data terupdate
   * @returns {Promise<Object>} Hasil update
   */
  update:  (id, data) => api.put(`/event-packages/${id}`, data),

  /**
   * Upload gambar paket event (Admin)
   * @param {number} id - ID Paket
   * @param {FormData} formData - Multipart data gambar
   * @returns {Promise<Object>} Path gambar
   */
  uploadGambar: (id, formData) => api.post(`/event-packages/${id}/upload-gambar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  /**
   * Hapus paket event (Admin)
   * @param {number} id - ID Paket
   * @returns {Promise<Object>} Status hapus
   */
  delete:  (id) => api.delete(`/event-packages/${id}`),
}

/**
 * @module services/eventEquip
 * @description Service untuk pengelolaan inventori peralatan event (Admin & Public)
 */
export const eventEquipService = {
  /**
   * Ambil seluruh alat event aktif
   * @returns {Promise<Object>} List alat
   */
  getAll:  () => api.get('/event-equipment'),

  /**
   * Ambil detail alat berdasarkan ID
   * @param {number} id - ID Alat
   * @returns {Promise<Object>} Detail alat
   */
  getById: (id) => api.get(`/event-equipment/${id}`),

  /**
   * Tambah alat baru (Admin)
   * @param {Object} data - Data alat
   * @returns {Promise<Object>} Alat yang dibuat
   */
  create:  (data) => api.post('/event-equipment', data),

  /**
   * Update data alat (Admin)
   * @param {number} id - ID Alat
   * @param {Object} data - Data terupdate
   * @returns {Promise<Object>} Hasil update
   */
  update:  (id, data) => api.put(`/event-equipment/${id}`, data),

  /**
   * Hapus alat (Admin)
   * @param {number} id - ID Alat
   * @returns {Promise<Object>} Status hapus
   */
  delete:  (id) => api.delete(`/event-equipment/${id}`),

  /**
   * Upload gambar alat (Admin)
   * @param {number} id - ID Alat
   * @param {FormData} formData - Multipart data gambar
   * @returns {Promise<Object>} Path gambar
   */
  uploadGambar: (id, formData) => api.post(`/event-equipment/${id}/upload-gambar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  /**
   * Ambil list alat yang termasuk dalam paket event tertentu
   * @param {number} id_package - ID Paket
   * @returns {Promise<Object>} List alat paket
   */
  getByPackage: (id_package) => api.get(`/event-equipment/package/${id_package}`),

  /**
   * Hubungkan/tambahkan alat ke paket event (Admin)
   * @param {number} id_package - ID Paket
   * @param {number} id_equipment - ID Alat
   * @returns {Promise<Object>} Hasil koneksi
   */
  addToPackage: (id_package, id_equipment) => api.post(`/event-equipment/package/${id_package}/add/${id_equipment}`),

  /**
   * Hapus alat dari paket event (Admin)
   * @param {number} id_package - ID Paket
   * @param {number} id_equipment - ID Alat
   * @returns {Promise<Object>} Hasil hapus koneksi
   */
  removeFromPackage: (id_package, id_equipment) => api.delete(`/event-equipment/package/${id_package}/remove/${id_equipment}`),
}

/**
 * @module services/eventSvc
 * @description Service untuk pengelolaan layanan/jasa event tambahan (Admin & Public)
 */
export const eventSvcService = {
  /**
   * Ambil semua layanan event aktif
   * @param {string} [status] - Filter status ('aktif', 'nonaktif')
   * @returns {Promise<Object>} List layanan
   */
  getAll:  (status) => api.get('/event-services', { params: { status } }),

  /**
   * Ambil detail layanan berdasarkan ID
   * @param {number} id - ID Layanan
   * @returns {Promise<Object>} Detail layanan
   */
  getById: (id)     => api.get(`/event-services/${id}`),

  /**
   * Tambah layanan baru (Admin)
   * @param {Object} data - Data layanan
   * @returns {Promise<Object>} Layanan yang dibuat
   */
  create:  (data)   => api.post('/event-services', data),

  /**
   * Update data layanan (Admin)
   * @param {number} id - ID Layanan
   * @param {Object} data - Data terupdate
   * @returns {Promise<Object>} Hasil update
   */
  update:  (id, data) => api.put(`/event-services/${id}`, data),

  /**
   * Hapus layanan (Admin)
   * @param {number} id - ID Layanan
   * @returns {Promise<Object>} Status hapus
   */
  delete:  (id)     => api.delete(`/event-services/${id}`),
}

/**
 * @module services/user
 * @description Service untuk pengelolaan profile dan user data (Admin & Customer)
 */
export const userService = {
  /**
   * Ambil seluruh user terdaftar (Admin)
   * @returns {Promise<Object>} List user
   */
  getAll:  ()            => api.get('/users'),

  /**
   * Ambil detail user berdasarkan ID
   * @param {number} id - ID User
   * @returns {Promise<Object>} Detail user
   */
  getById: (id)          => api.get(`/users/${id}`),

  /**
   * Update profile/data user
   * @param {number} id - ID User
   * @param {Object} data - Data terupdate (nama, no_hp, password, dll)
   * @returns {Promise<Object>} Hasil update
   */
  update:  (id, data)    => api.put(`/users/${id}`, data),

  /**
   * Hapus user (Admin)
   * @param {number} id - ID User
   * @returns {Promise<Object>} Status hapus
   */
  delete:  (id)          => api.delete(`/users/${id}`),
}

/**
 * @module services/report
 * @description Service untuk data dashboard & laporan keuangan (Admin)
 */
export const reportService = {
  /**
   * Ambil statistik ringkasan dashboard
   * @returns {Promise<Object>} Statistik dashboard
   */
  getDashboard:    () => api.get('/reports/dashboard'),

  /**
   * Ambil laporan detail transaksi berdasarkan filter
   * @param {Object} params - Filter data (startDate, endDate, type)
   * @returns {Promise<Object>} List transaksi keuangan
   */
  getTransactions: (params) => api.get('/reports/transactions', { params }),
}
