# Alternatif Gaya Dokumentasi untuk Presentasi

Pilihan format dokumentasi yang lebih detail dan presentable.

---

## 🎨 GAYA 1: Extended JSDoc (Detailed)

Format JSDoc yang diperluas dengan @description, @example, @note, dan penjelasan lebih lengkap.

### Contoh: Login Function

```javascript
/**
 * Authenticate user dan generate JWT token
 * 
 * @description
 * Function ini memproses login user dengan validasi email dan password.
 * Password akan di-compare dengan hash yang disimpan di database menggunakan bcryptjs.
 * Jika valid, system akan generate JWT token yang berisi user credentials.
 * Token ini disimpan di localStorage client dan digunakan untuk request API selanjutnya.
 * 
 * @async
 * @route POST /api/auth/login
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body dari client
 * @param {string} req.body.email - Email address user (contoh: user@example.com)
 * @param {string} req.body.password - Password plain text yang akan divalidasi
 * @param {Object} res - Express response object untuk mengirim reply
 * 
 * @returns {200} Login successful
 * @returns {Object} Response object dengan struktur:
 *          {
 *            success: true,
 *            message: "Login berhasil.",
 *            data: {
 *              token: "eyJhbGciOiJIUzI1NiIs...",
 *              user: { id_user, email, nama, role }
 *            }
 *          }
 * 
 * @throws {400} 
 *         - Jika email atau password kosong
 *         - Message: "Email dan password wajib diisi."
 * 
 * @throws {401}
 *         - Jika email tidak ditemukan di database
 *         - Jika password tidak sesuai dengan hash
 *         - Message: "Email atau password salah."
 * 
 * @throws {500}
 *         - Database connection error
 *         - Token generation error
 * 
 * @requires public - Tidak perlu authentication
 * 
 * @example
 * // Request dari client
 * POST /api/auth/login
 * Content-Type: application/json
 * 
 * {
 *   "email": "customer@soundville.com",
 *   "password": "rahasia123"
 * }
 * 
 * // Response success
 * {
 *   "success": true,
 *   "message": "Login berhasil.",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "user": {
 *       "id_user": 1,
 *       "email": "customer@soundville.com",
 *       "nama": "Budi Santoso",
 *       "role": "customer"
 *     }
 *   }
 * }
 * 
 * @note
 * - Password tidak pernah disimpan di response untuk keamanan
 * - Token valid selama 7 hari
 * - Client harus menyimpan token di localStorage dan attach ke header
 * 
 * @todo
 * - Implement refresh token mechanism
 * - Add rate limiting untuk prevent brute force
 * - Add 2FA (Two-Factor Authentication)
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email dan password wajib diisi.' 
      });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau password salah.' 
      });
    }

    const isValid = await UserModel.comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau password salah.' 
      });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: 'Login berhasil.',
      data: { token, user: sanitizeUser(user) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

**Keuntungan:**
- ✅ Sangat detail dan informatif
- ✅ Include contoh request/response
- ✅ Penjelasan business logic jelas
- ✅ Future improvements terlihat (@todo)
- ✅ Sempurna untuk presentasi teknis

---

## 🎨 GAYA 2: Inline Detailed Comments

Kombinasi JSDoc ringkas + inline comments yang explanatory di dalam function body.

### Contoh: Create Booking Function

```javascript
/**
 * Buat booking studio baru dengan validasi lengkap
 * @async
 * @route POST /api/bookings
 * @param {Object} req - Request dengan body: { id_studio, tanggal, jam_mulai, jam_selesai }
 * @param {Object} res - Response object
 * @returns {201} Booking berhasil dibuat
 * @throws {400} Validasi gagal
 * @throws {409} Jadwal konflik
 * @requires customer
 */
const createBooking = async (req, res) => {
  try {
    const { id_studio, tanggal, jam_mulai, jam_selesai, catatan } = req.body;
    const id_user = req.user.id_user;

    // ========== VALIDASI INPUT ==========
    // Cek apakah semua field required sudah terisi
    if (!id_studio || !tanggal || !jam_mulai || !jam_selesai) {
      return res.status(400).json({ 
        success: false, 
        message: 'Semua field wajib diisi.' 
      });
    }

    // ========== NORMALISASI TANGGAL ==========
    // Konversi ISO format (2024-01-15T00:00:00) ke YYYY-MM-DD
    // Gunakan string comparison untuk avoid timezone issues
    const normalizedDate = tanggal.includes('T') 
      ? tanggal.split('T')[0] 
      : tanggal;
    
    // ========== VALIDASI JAM ==========
    // Pastikan jam_mulai < jam_selesai (contoh: 09:00 < 12:00)
    if (jam_mulai >= jam_selesai) {
      return res.status(400).json({ 
        success: false, 
        message: 'Jam mulai harus lebih awal dari jam selesai.' 
      });
    }

    // ========== VALIDASI TANGGAL TIDAK MASA LALU ==========
    // Bandingkan dengan hari ini menggunakan string format YYYY-MM-DD
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    if (normalizedDate < todayStr) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tanggal booking tidak boleh di masa lalu.' 
      });
    }

    // ========== CEK STUDIO TERSEDIA ==========
    // Validasi: studio harus ada dan status 'aktif'
    const studio = await StudioModel.findById(id_studio);
    if (!studio) {
      return res.status(404).json({ 
        success: false, 
        message: 'Studio tidak ditemukan.' 
      });
    }
    if (studio.status !== 'aktif') {
      return res.status(400).json({ 
        success: false, 
        message: 'Studio tidak tersedia saat ini.' 
      });
    }

    // ========== CEK KONFLIK JADWAL ==========
    // Query database untuk lihat apakah ada booking lain di jam yang sama
    // Jika ada, return error 409 (Conflict)
    const isAvailable = await BookingModel.isScheduleAvailable(
      id_studio, 
      normalizedDate, 
      jam_mulai, 
      jam_selesai
    );
    
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Jadwal yang dipilih sudah dipesan. Silakan pilih jam yang lain.',
      });
    }

    // ========== HITUNG TOTAL HARGA ==========
    // Formula: (jam_selesai - jam_mulai) × harga_per_jam
    // Contoh: 09:00 - 12:00 = 3 jam × Rp 500,000 = Rp 1,500,000
    const jamMulaiNum   = parseFloat(jam_mulai.split(':')[0]) + parseFloat(jam_mulai.split(':')[1]) / 60;
    const jamSelesaiNum = parseFloat(jam_selesai.split(':')[0]) + parseFloat(jam_selesai.split(':')[1]) / 60;
    const durasiJam     = jamSelesaiNum - jamMulaiNum;
    const total_harga   = durasiJam * parseFloat(studio.harga_per_jam);

    // ========== SIMPAN KE DATABASE ==========
    // Insert booking baru dengan status 'pending' (menunggu payment)
    const id_booking = await BookingModel.create({
      id_user,
      id_studio,
      tanggal: normalizedDate,
      jam_mulai,
      jam_selesai,
      total_harga,
      catatan,
      status_booking: 'pending'
    });

    // ========== RETURN RESPONSE ==========
    // Ambil data booking yang baru dibuat dari database
    const booking = await BookingModel.findById(id_booking);

    res.status(201).json({
      success: true,
      message: 'Booking berhasil dibuat. Silakan upload bukti pembayaran.',
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};
```

**Keuntungan:**
- ✅ Setiap section jelas dengan header
- ✅ Mudah dipahami step-by-step
- ✅ Bagus untuk code review dan training
- ✅ Ideal untuk dokumentasi inline

---

## 🎨 GAYA 3: Block Comments dengan Flow Diagram

Dokumentasi dengan visual flow dan struktur yang lebih jelas.

```javascript
/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║         BOOKING CREATION WORKFLOW                                   ║
 * ╠════════════════════════════════════════════════════════════════════╣
 * ║                                                                     ║
 * ║  INPUT: { id_studio, tanggal, jam_mulai, jam_selesai, catatan }   ║
 * ║    ↓                                                                ║
 * ║  [1] Validasi Input (field wajib ada?)                             ║
 * ║    ├─ NO  → Return 400 "Field wajib diisi"                         ║
 * ║    └─ YES ↓                                                        ║
 * ║  [2] Normalisasi Tanggal (format ISO → YYYY-MM-DD)                ║
 * ║    ↓                                                                ║
 * ║  [3] Validasi Jam (jam_mulai < jam_selesai?)                       ║
 * ║    ├─ NO  → Return 400 "Jam invalid"                               ║
 * ║    └─ YES ↓                                                        ║
 * ║  [4] Validasi Tanggal (bukan masa lalu?)                           ║
 * ║    ├─ NO  → Return 400 "Tanggal masa lalu"                         ║
 * ║    └─ YES ↓                                                        ║
 * ║  [5] Cek Studio (ada & aktif?)                                     ║
 * ║    ├─ NO  → Return 404 "Studio tidak ditemukan"                    ║
 * ║    └─ YES ↓                                                        ║
 * ║  [6] Cek Konflik Jadwal (ada booking lain di jam tersebut?)       ║
 * ║    ├─ YES → Return 409 "Jadwal sudah dipesan"                      ║
 * ║    └─ NO  ↓                                                        ║
 * ║  [7] Hitung Total Harga (durasi × harga_per_jam)                   ║
 * ║    ↓                                                                ║
 * ║  [8] Insert ke Database                                            ║
 * ║    ↓                                                                ║
 * ║  OUTPUT: { id_booking, status: pending, total_harga }              ║
 * ║           Return 201 "Booking berhasil dibuat"                      ║
 * ║                                                                     ║
 * ╚════════════════════════════════════════════════════════════════════╝
 * 
 * @async
 * @route POST /api/bookings
 * @param {Object} req - Request dengan { id_studio, tanggal, jam_mulai, jam_selesai }
 * @returns {201} Booking created
 * @throws {400|404|409} Validation errors
 * @requires customer
 */
const createBooking = async (req, res) => {
  // Implementation...
};
```

**Keuntungan:**
- ✅ Visual flow yang mudah dipahami
- ✅ Sangat bagus untuk presentasi di PowerPoint
- ✅ Decision tree terlihat jelas
- ✅ Cocok untuk menjelaskan algoritma kompleks

---

## 🎨 GAYA 4: Hybrid Approach (JSDoc + Detailed Inline)

Kombinasi terbaik: JSDoc profesional + inline comments explanatory.

```javascript
/**
 * Create new booking with complete validation and schedule checking
 * 
 * Business Logic:
 * - Validate all required fields and data types
 * - Check for schedule conflicts with existing bookings
 * - Calculate total price based on duration and studio rate
 * - Status always 'pending' (waiting for payment confirmation)
 * 
 * @async
 * @route POST /api/bookings
 * @param {Object} req
 * @param {Object} req.body
 * @param {number} req.body.id_studio - Studio yang akan dipesan
 * @param {string} req.body.tanggal - Tanggal booking (YYYY-MM-DD)
 * @param {string} req.body.jam_mulai - Start time (HH:mm)
 * @param {string} req.body.jam_selesai - End time (HH:mm)
 * @param {string} [req.body.catatan] - Customer notes
 * @param {Object} res
 * 
 * @returns {201} { success, message, data: Booking }
 * @throws {400} Validation error (empty fields, invalid time, past date)
 * @throws {404} Studio not found
 * @throws {409} Schedule conflict - jam sudah dipesan
 * @throws {500} Database error
 * 
 * @requires customer
 * 
 * @example
 * POST /api/bookings
 * { "id_studio": 1, "tanggal": "2024-06-20", "jam_mulai": "09:00", "jam_selesai": "12:00" }
 * → { success: true, data: { id_booking: 5, status_booking: "pending", total_harga: 1500000 } }
 */
const createBooking = async (req, res) => {
  try {
    const { id_studio, tanggal, jam_mulai, jam_selesai, catatan } = req.body;
    const id_user = req.user.id_user;

    // 1️⃣ Validate all required fields exist and are not empty
    if (!id_studio || !tanggal || !jam_mulai || !jam_selesai) {
      return res.status(400).json({ 
        success: false, 
        message: 'Semua field wajib diisi.' 
      });
    }

    // 2️⃣ Normalize date from ISO format (YYYY-MM-DDTHH:mm:ss) to YYYY-MM-DD
    //    This prevents timezone-related issues with date comparisons
    const normalizedDate = tanggal.includes('T') ? tanggal.split('T')[0] : tanggal;

    // 3️⃣ Validate time: start time must be before end time
    if (jam_mulai >= jam_selesai) {
      return res.status(400).json({ 
        success: false, 
        message: 'Jam mulai harus lebih awal dari jam selesai.' 
      });
    }

    // 4️⃣ Validate date is not in the past
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (normalizedDate < todayStr) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tanggal booking tidak boleh di masa lalu.' 
      });
    }

    // 5️⃣ Check if studio exists and is active (operational)
    const studio = await StudioModel.findById(id_studio);
    if (!studio) {
      return res.status(404).json({ 
        success: false, 
        message: 'Studio tidak ditemukan.' 
      });
    }
    if (studio.status !== 'aktif') {
      return res.status(400).json({ 
        success: false, 
        message: 'Studio tidak tersedia saat ini.' 
      });
    }

    // 6️⃣ Check for schedule conflicts with other bookings
    //    Query: SELECT * FROM bookings WHERE id_studio = ? AND tanggal = ? AND jam_mulai < ? AND jam_selesai > ?
    //    If exists → someone already booked this time slot
    const isAvailable = await BookingModel.isScheduleAvailable(
      id_studio, 
      normalizedDate, 
      jam_mulai, 
      jam_selesai
    );
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Jadwal yang dipilih sudah dipesan. Silakan pilih jam yang lain.',
      });
    }

    // 7️⃣ Calculate total price
    //    Formula: (end_hour + end_minute/60) - (start_hour + start_minute/60) × rate_per_hour
    //    Example: 09:00 to 12:00 = 3 hours × Rp 500,000 = Rp 1,500,000
    const jamMulaiNum = parseFloat(jam_mulai.split(':')[0]) + parseFloat(jam_mulai.split(':')[1]) / 60;
    const jamSelesaiNum = parseFloat(jam_selesai.split(':')[0]) + parseFloat(jam_selesai.split(':')[1]) / 60;
    const durasiJam = jamSelesaiNum - jamMulaiNum;
    const total_harga = durasiJam * parseFloat(studio.harga_per_jam);

    // 8️⃣ Insert booking to database with 'pending' status
    //    Customer must upload payment proof before status changes to 'confirmed'
    const id_booking = await BookingModel.create({
      id_user,
      id_studio,
      tanggal: normalizedDate,
      jam_mulai,
      jam_selesai,
      total_harga,
      catatan,
      status_booking: 'pending'
    });

    // 9️⃣ Fetch the newly created booking and return to client
    const booking = await BookingModel.findById(id_booking);

    res.status(201).json({
      success: true,
      message: 'Booking berhasil dibuat. Silakan upload bukti pembayaran.',
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};
```

**Keuntungan:**
- ✅ Profesional untuk presentation
- ✅ Sangat detail dan mudah dipahami
- ✅ Numbered steps membuat flow jelas
- ✅ Perpaduan terbaik antara keduanya

---

## 📊 Perbandingan Gaya

| Gaya | Detail | Presentasi | Maintenance | Code Cleanliness |
|------|--------|-----------|-------------|------------------|
| **Standard JSDoc** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Extended JSDoc** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Inline Detailed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Flow Diagram** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Hybrid** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 Rekomendasi Penggunaan

- **Extended JSDoc** → Presentation slide dokumentasi, profesional maksimal
- **Inline Detailed** → Code documentation untuk team, training materials
- **Flow Diagram** → Presentasi algoritma kompleks, flowchart visual
- **Hybrid** → Production code, balance antara presentable dan maintainable

---

## ❓ Pertanyaan: Gaya mana yang Anda prefer untuk controllers?

1. Extended JSDoc (most professional)
2. Inline Detailed (most explanatory)
3. Flow Diagram (most visual)
4. Hybrid Approach (balanced)
5. Tetap Standard JSDoc (sudah ada sekarang)

