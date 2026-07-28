const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

/**
 * Generate JWT token untuk user authentication
 * @param {Object} user - User object dari database
 * @param {number} user.id_user - ID user
 * @param {string} user.email - Email user
 * @param {string} user.role - Role user (admin/customer)
 * @param {string} user.nama - Nama user
 * @returns {string} JWT token yang sudah di-sign
 */
const generateToken = (user) => {
  return jwt.sign(
    { id_user: user.id_user, email: user.email, role: user.role, nama: user.nama },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

/**
 * Register user baru ke sistem
 * @async
 * @route POST /api/auth/register
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.nama - Nama lengkap user
 * @param {string} req.body.email - Email user (unique)
 * @param {string} req.body.password - Password user (minimal 6 karakter)
 * @param {string} [req.body.no_hp] - Nomor telepon user (opsional)
 * @param {Object} res - Express response object
 * @returns {201} User berhasil dibuat
 * @returns {Object} { success: true, data: { user, token } }
 * @throws {400} Jika field wajib tidak lengkap
 * @throws {409} Jika email sudah terdaftar
 * @throws {500} Server error
 */
const register = async (req, res) => {
  try {
    const { nama, email, password, no_hp } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    }

    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
    }

    const id = await UserModel.create({ nama, email, password, no_hp, role: 'customer' });
    const user = await UserModel.findById(id);
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      data: { user, token },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Login user dengan email dan password
 * @async
 * @route POST /api/auth/login
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - Email user
 * @param {string} req.body.password - Password user
 * @param {Object} res - Express response object
 * @returns {200} Login berhasil
 * @returns {Object} { success: true, data: { token, user } }
 * @throws {400} Jika email atau password tidak diisi
 * @throws {401} Jika email atau password salah
 * @throws {500} Server error
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const isValid = await UserModel.comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        user: {
          id_user:  user.id_user,
          nama:     user.nama,
          email:    user.email,
          no_hp:    user.no_hp,
          role:     user.role,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil informasi user yang sedang login
 * @async
 * @route GET /api/auth/me
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object dari JWT token (di-inject oleh middleware)
 * @param {number} req.user.id_user - ID user dari token
 * @param {Object} res - Express response object
 * @returns {200} User info berhasil diambil
 * @returns {Object} { success: true, data: User }
 * @throws {404} User tidak ditemukan
 * @throws {500} Server error
 * @requires JWT token di Authorization header
 */
const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id_user);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe };
