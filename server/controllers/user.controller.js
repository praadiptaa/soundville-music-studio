const UserModel = require('../models/user.model');

/**
 * Ambil semua users (admin)
 * 
 * @description
 * Admin view daftar semua users (customers + admin users) di sistem.
 * Menampilkan nama, email, nomor HP, role, dan tanggal registrasi.
 * Admin bisa filter berdasarkan role atau status di future version.
 * 
 * @async
 * @route GET /api/users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @returns {200} List semua users
 * @returns {Array<Object>} Array of user objects:
 *          [
 *            {
 *              id_user,
 *              nama,
 *              email,
 *              no_hp,
 *              role,
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
 * GET /api/users
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id_user": 1,
 *       "nama": "Budi Admin",
 *       "email": "admin@soundville.com",
 *       "no_hp": "08123456789",
 *       "role": "admin",
 *       "created_at": "2024-01-10T08:30:00Z"
 *     },
 *     {
 *       "id_user": 5,
 *       "nama": "Andi Pelanggan",
 *       "email": "andi@email.com",
 *       "no_hp": "08987654321",
 *       "role": "customer",
 *       "created_at": "2024-06-15T14:20:00Z"
 *     }
 *   ]
 * }
 * 
 * @note
 * - Password tidak ditampilkan di response (security)
 * - Role bisa 'admin' atau 'customer'
 * - Semua users ditampilkan tanpa filter default (add filter parameter di future)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.findAll();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil detail user spesifik
 * 
 * @description
 * Fetch data detail user tertentu. Admin bisa lihat profil user manapun.
 * Customer hanya bisa lihat profil mereka sendiri (implemented di frontend via role check).
 * 
 * @async
 * @route GET /api/users/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - User ID
 * @param {Object} res - Express response object
 * 
 * @returns {200} User detail berhasil diambil
 * @returns {Object} User object lengkap (tanpa password)
 * 
 * @throws {404} User tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * GET /api/users/5
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id_user": 5,
 *     "nama": "Andi Pelanggan",
 *     "email": "andi@email.com",
 *     "no_hp": "08987654321",
 *     "role": "customer",
 *     "alamat": "Jl. Sudirman No. 123, Jakarta",
 *     "created_at": "2024-06-15T14:20:00Z",
 *     "updated_at": "2024-06-15T14:20:00Z"
 *   }
 * }
 * 
 * @note
 * - Password tidak ditampilkan (security)
 */
const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update profil user
 * 
 * @description
 * Update data profil user (nama, email, nomor HP, alamat, dll).
 * Customer hanya bisa edit profil sendiri (access control).
 * Admin bisa edit profil user manapun.
 * Email harus unique (tidak boleh duplikat dengan user lain).
 * 
 * @async
 * @route PUT /api/users/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - User ID yang akan diupdate
 * @param {Object} req.body - Request body (hanya field yang mau diupdate)
 * @param {string} [req.body.nama] - Nama lengkap
 * @param {string} [req.body.email] - Email address (harus unique)
 * @param {string} [req.body.no_hp] - Nomor HP
 * @param {string} [req.body.alamat] - Alamat rumah/bisnis
 * @param {Object} req.user - User object dari JWT
 * @param {number} req.user.id_user - ID user yang sedang login
 * @param {string} req.user.role - Role user (admin/customer)
 * @param {Object} res - Express response object
 * 
 * @returns {200} Profil user berhasil diupdate
 * @returns {Object} { success: true, message: '...', data: User }
 * 
 * @throws {403} Customer mencoba edit profil orang lain
 * @throws {404} User tidak ditemukan
 * @throws {409} Email sudah digunakan user lain
 * @throws {500} Database error
 * 
 * @requires customer|admin
 * 
 * @example
 * PUT /api/users/5
 * Content-Type: application/json
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * {
 *   "nama": "Andi Pratama",
 *   "email": "andi.pratama@email.com",
 *   "no_hp": "08123456789",
 *   "alamat": "Jl. Sudirman No. 456, Jakarta Selatan"
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Data user berhasil diperbarui.",
 *   "data": {
 *     "id_user": 5,
 *     "nama": "Andi Pratama",
 *     "email": "andi.pratama@email.com",
 *     "no_hp": "08123456789",
 *     "alamat": "Jl. Sudirman No. 456, Jakarta Selatan",
 *     "role": "customer",
 *     "updated_at": "2024-06-16T10:30:00Z"
 *   }
 * }
 * 
 * Response 403 (Customer edit orang lain):
 * {
 *   "success": false,
 *   "message": "Akses ditolak."
 * }
 * 
 * @note
 * - Access control: customer hanya edit profil sendiri, admin bisa edit semua
 * - Email validation: tidak boleh sama dengan email user lain (uniqueness)
 * - Password tidak bisa diubah via endpoint ini (gunakan forgot-password flow)
 * - Field yang kosong bisa diabaikan (partial update)
 * 
 * @todo
 * - Implement separate password change endpoint
 * - Add email verification flow saat email diubah
 * - Add activity/audit log untuk profile changes
 * - Support profile picture upload
 */
const updateUser = async (req, res) => {
  try {
    const { nama, email, no_hp, role } = req.body;
    const targetId = req.params.id;

    // Customer hanya boleh edit profil sendiri
    if (req.user.role === 'customer' && req.user.id_user !== parseInt(targetId)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    // Role hanya bisa diubah jika request dikirim oleh Admin
    const roleToUpdate = req.user.role === 'admin' ? role : undefined;

    const affected = await UserModel.update(targetId, { nama, email, no_hp, role: roleToUpdate });
    if (!affected) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    const user = await UserModel.findById(targetId);
    res.json({ success: true, message: 'Data user berhasil diperbarui.', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete user (admin)
 * 
 * @description
 * Admin menghapus user dari sistem. User yang dihapus tidak bisa login lagi.
 * Sebelum delete, admin harus pastikan semua data related (bookings, events, payments) sudah dihandle.
 * Implementasi soft-delete recommended untuk audit trail dan data recovery (currently hard-delete).
 * 
 * @async
 * @route DELETE /api/users/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - User ID yang akan dihapus
 * @param {Object} res - Express response object
 * 
 * @returns {200} User berhasil dihapus
 * @returns {Object} { success: true, message: 'User berhasil dihapus.' }
 * 
 * @throws {404} User tidak ditemukan
 * @throws {500} Database error
 * 
 * @requires admin
 * 
 * @example
 * DELETE /api/users/15
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "User berhasil dihapus."
 * }
 * 
 * Response 404:
 * {
 *   "success": false,
 *   "message": "User tidak ditemukan."
 * }
 * 
 * @note
 * - Currently implemented as hard-delete (data tidak bisa di-recover)
 * - User yang dihapus tidak bisa login lagi
 * - Pastikan semua booking/event dari user sudah ditangani sebelum delete
 * - Action ini tidak bisa di-undo
 * 
 * @todo
 * - Implement soft-delete dengan timestamps (deleted_at)
 * - Add cascade delete handling untuk bookings, events, payments
 * - Implement admin confirmation dialog sebelum delete
 * - Add activity log/audit trail untuk user deletion
 * - Consider data export sebelum deletion (GDPR compliance)
 */
const deleteUser = async (req, res) => {
  try {
    const affected = await UserModel.delete(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    res.json({ success: true, message: 'User berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update role user (admin only)
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const targetId = req.params.id;

    const validRoles = ['admin', 'operator', 'customer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role tidak valid.' });
    }

    const affected = await UserModel.updateRole(targetId, role);
    if (!affected) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    res.json({ success: true, message: `Role user berhasil diubah menjadi "${role}".` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, updateUserRole };
