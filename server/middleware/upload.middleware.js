const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Payment Upload Middleware - Multer Configuration
 * 
 * @description
 * Middleware untuk handle file upload payment proof (bukti transfer) dari customer.
 * Configuration ini:
 * - Menyimpan file ke folder: uploads/payments/
 * - Menerima file type: JPG, PNG, PDF
 * - Max file size: 5MB per file
 * - Generate unique filename untuk prevent overwrite
 * 
 * Workflow:
 * 1. Create uploads/payments folder jika belum ada (recursive)
 * 2. Config storage: destination folder + unique filename
 * 3. Config fileFilter: validasi file type & mimetype
 * 4. Create multer instance dengan storage + fileFilter + limits
 * 
 * @usage
 * // Di routes file:
 * const upload = require('../middleware/upload.middleware');
 * router.post('/api/payments', upload.single('bukti_transfer'), uploadPayment);
 * 
 * // Di controller:
 * const uploadPayment = (req, res) => {
 *   const filepath = `uploads/payments/${req.file.filename}`;
 *   // Save filepath to database
 * };
 * 
 * @note
 * - Folder otomatis dibuat dengan recursive: true
 * - Filename format: payment-{timestamp}-{random}.{ext}
 * - File disimpan di: server/uploads/payments/
 * - Max size 5MB (5 * 1024 * 1024 bytes)
 * - Allowed types: JPG, PNG, PDF (untuk payment proof)
 * - File filter validasi extension AND mimetype (double check)
 * - Error thrown jika file tidak valid
 * 
 * @example
 * // Browser upload
 * const formData = new FormData();
 * formData.append('bukti_transfer', fileInput.files[0]);
 * formData.append('id_booking', 12);
 * 
 * fetch('/api/payments', {
 *   method: 'POST',
 *   headers: { 'Authorization': 'Bearer token...' },
 *   body: formData
 * });
 * 
 * // Stored file: uploads/payments/payment-1718541234567-123456789.jpg
 * 
 * @todo
 * - Implement image compression untuk reduce storage
 * - Add OCR untuk auto-extract payment details
 * - Implement virus scan untuk security
 * - Add file cleanup task (delete old files > 30 days)
 */

// Buat folder uploads jika belum ada
const uploadDir = path.join(__dirname, '..', 'uploads', 'payments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Multer disk storage configuration untuk payment files
 * Menyimpan file ke disk dengan unique filename
 * 
 * @param {Object} req - Express request object
 * @param {Object} file - File object dari multer
 * @param {Function} cb - Callback function (null, destination_path)
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `payment-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter untuk validasi payment file type dan mimetype
 * Memastikan hanya JPG, PNG, PDF yang diterima
 * 
 * @param {Object} req - Express request object
 * @param {Object} file - File object
 * @param {Function} cb - Callback (error, allowed)
 * @returns {void} Call cb(null, true) jika valid, cb(error) jika invalid
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Hanya file JPG, PNG, atau PDF yang diizinkan.'));
};

/**
 * Multer instance untuk payment file upload
 * Configuration: storage + fileFilter + limits
 * 
 * @type {Object} Multer middleware instance
 * @property {Object} storage - Disk storage configuration
 * @property {Function} fileFilter - File type validation
 * @property {Object} limits - { fileSize: 5MB }
 */
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter,
});

module.exports = upload;
