# JSDoc Style Guide - Soundville Music Studio

Panduan penggunaan JSDoc untuk dokumentasi code yang professional dan presentation-ready.

---

## 📋 Format Dasar JSDoc

### Function dengan Parameters & Return

```javascript
/**
 * Deskripsi singkat tentang apa yang dilakukan function ini
 * @async
 * @route HTTP_METHOD /api/endpoint/path
 * @param {Type} paramName - Deskripsi parameter
 * @param {Type} nestedParam.property - Deskripsi property nested
 * @param {Type} [optionalParam] - Parameter opsional (gunakan [ ])
 * @returns {StatusCode} Deskripsi return value
 * @returns {Object} { key: value, ... }
 * @throws {ErrorCode} Deskripsi error yang mungkin
 * @requires authType (admin/customer/token)
 * @public|@private
 */
const functionName = (param) => {
  // Implementation
};
```

---

## 🎯 Kategori Tags yang Digunakan

### 1. **@async** - Untuk async functions
```javascript
/**
 * Fetch data dari database
 * @async
 */
const getData = async () => { }
```

### 2. **@route** - HTTP endpoint
```javascript
/**
 * @route GET /api/users/:id
 * @route POST /api/studios (Admin only)
 * @route PUT /api/bookings/:id
 */
```

### 3. **@param** - Parameter input
```javascript
/**
 * @param {string} name - Nama user
 * @param {number} age - Umur user
 * @param {Array<Object>} items - List of items dengan struktur { id, name }
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.sortBy] - Field untuk sorting
 */
```

### 4. **@returns** - Return value
```javascript
/**
 * @returns {200} Success response
 * @returns {Object} { success: true, data: User }
 * 
 * @returns {400} Bad request
 * @returns {401} Unauthorized
 * @returns {404} Not found
 * @returns {500} Server error
 */
```

### 5. **@throws** - Error handling
```javascript
/**
 * @throws {400} Jika email format salah
 * @throws {409} Jika email sudah terdaftar
 * @throws {500} Database connection error
 */
```

### 6. **@requires** - Permission/Authentication
```javascript
/**
 * @requires admin        // Hanya admin
 * @requires customer     // Hanya customer
 * @requires token        // Memerlukan JWT token
 */
```

---

## 📚 Contoh Lengkap

### Controller Function - Auth (POST/Login)

```javascript
/**
 * Authenticate user dengan email dan password
 * @async
 * @route POST /api/auth/login
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - Email user untuk login
 * @param {string} req.body.password - Password user (plain text)
 * @param {Object} res - Express response object
 * @returns {200} Login successful
 * @returns {Object} { success: true, data: { token, user } }
 * @throws {400} Email atau password kosong
 * @throws {401} Email atau password salah
 * @throws {500} Server error
 * @public
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

### Model Function - Database Query

```javascript
/**
 * Find user by email address dengan semua detail
 * @param {string} email - Email address untuk dicari
 * @returns {Promise<Object|null>} User object atau null jika tidak ditemukan
 * @throws {Error} Database connection error
 */
static async findByEmail(email) {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}
```

### Route Definition

```javascript
/**
 * Admin - Get all bookings dengan detail lengkap
 * @route GET /api/bookings
 * @access Admin only
 * @returns {200} Array of bookings
 */
router.get('/', verifyToken, isAdmin, getAllBookings);

/**
 * Customer - Create new booking
 * @route POST /api/bookings
 * @access Customer
 * @body { id_studio, tanggal, jam_mulai, jam_selesai }
 * @returns {201} Created booking
 */
router.post('/', verifyToken, createBooking);
```

---

## ✨ Best Practices

### 1. **Urutan Tags**
```javascript
/**
 * Deskripsi
 * @async (jika ada)
 * @route
 * @param
 * @param
 * @returns
 * @throws
 * @requires
 * @public/@private
 */
```

### 2. **Deskripsi yang Jelas**
```javascript
// ❌ BURUK
/**
 * Get booking
 */

// ✅ BAIK
/**
 * Ambil detail booking dengan seluruh informasi studio, customer, dan payment
 */
```

### 3. **Type Definitions**
```javascript
// ✅ BAIK - Tipe jelas
@param {string} email
@param {number} id
@param {boolean} isActive
@param {Array<string>} tags
@param {Object} options
@param {Date} createdAt

// ✅ BAIK - Custom types
@param {User} user - User object dari database
@param {Studio} studio - Studio object
```

### 4. **Optional Parameters**
```javascript
// ✅ GUNAKAN [ ] untuk optional
@param {string} [description] - Optional description
@param {string} [req.query.status] - Optional filter

// ❌ JANGAN
@param {string} description - Optional description
```

---

## 🎓 Keuntungan JSDoc untuk Presentasi

1. **Professional Looking** - Terlihat seperti library dokumentasi
2. **IDE Support** - Tooltip muncul di VS Code saat hover
3. **Struktur Konsisten** - Semua function memiliki format sama
4. **Mudah di-screenshot** - Bagus untuk slides/presentasi
5. **Autocomplete Assist** - Developer bisa lihat dokumentasi saat coding

---

## 📊 File yang Sudah JSDoc-ified

- ✅ `server/controllers/auth.controller.js`
- ✅ `server/controllers/studio.controller.js`
- ⏳ `server/controllers/booking.controller.js` (in progress)
- ⏳ Sisa controllers, models, dan routes

---

## 🔗 Referensi

- [JSDoc Official](https://jsdoc.app/)
- [Google Style Guide](https://google.github.io/styleguide/tsguide.html#jsdoc)
- [VS Code IntelliSense](https://code.visualstudio.com/docs/editor/intellisense)

