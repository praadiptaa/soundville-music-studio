/**
 * @module middleware/auth
 * @description Middleware untuk verifikasi JWT token dan validasi role akses (admin/customer)
 */
const jwt = require('jsonwebtoken'); // Library untuk JWT verification

/**
 * Middleware: Verifikasi JWT token dari Authorization header
 * 
 * @description
 * Membaca JWT token dari request header "Authorization: Bearer <token>", 
 * melakukan verifikasi, dan menyimpan data payload user yang di-decode ke req.user.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * @throws {401} Jika token tidak ditemukan
 * @throws {403} Jika token tidak valid atau expired
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; // Get Authorization header
  const token = authHeader && authHeader.split(' ')[1]; // Extract token dari "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token dengan secret key
    req.user = decoded; // Simpan decoded token data di req.user
    next(); // Lanjut ke middleware/controller berikutnya
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
};

/**
 * Middleware: Validasi user hanya role admin
 * 
 * @description
 * Memastikan request dikirim oleh user dengan role 'admin'. Harus dipasang setelah verifyToken.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * @throws {403} Jika role user bukan admin
 */
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') { // Check jika user role bukan admin
    return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }
  next(); // Izinkan akses jika user adalah admin
};

/**
 * Middleware: Validasi user hanya role customer
 * 
 * @description
 * Memastikan request dikirim oleh user dengan role 'customer'. Harus dipasang setelah verifyToken.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * @throws {403} Jika role user bukan customer
 */
const isCustomer = (req, res, next) => {
  if (req.user?.role !== 'customer') { // Check jika user role bukan customer
    return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya customer yang diizinkan.' });
  }
  next(); // Izinkan akses jika user adalah customer
};

module.exports = { verifyToken, isAdmin, isCustomer }; // Export semua middleware functions
