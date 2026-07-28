/**
 * @module middleware/auth
 * @description Middleware untuk verifikasi JWT token dan validasi role akses (admin/customer/operator)
 */
const jwt = require('jsonwebtoken');

/**
 * Middleware: Verifikasi JWT token dari Authorization header
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'soundville_jwt_secret_key_2024');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
};

/**
 * Middleware: Validasi user hanya role admin
 */
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }
  next();
};

/**
 * Middleware: Validasi user role staff (admin atau operator)
 */
const isStaff = (req, res, next) => {
  if (!['admin', 'operator'].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya admin atau operator yang diizinkan.' });
  }
  next();
};

/**
 * Middleware: Validasi user hanya role customer
 */
const isCustomer = (req, res, next) => {
  if (req.user?.role !== 'customer') {
    return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya customer yang diizinkan.' });
  }
  next();
};

module.exports = { verifyToken, isAdmin, isStaff, isCustomer };
