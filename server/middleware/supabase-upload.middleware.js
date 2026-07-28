/**
 * Supabase Storage Upload Helper
 * 
 * Menggantikan multer disk storage dengan Supabase Storage.
 * File diterima sebagai buffer (multer memoryStorage) lalu diunggah ke Supabase bucket.
 * 
 * Bucket yang digunakan:
 *  - soundville-images  (studio, equipment, package photos)
 *  - soundville-payments (payment proof files)
 * 
 * Semua bucket bersifat PUBLIC sehingga URL dapat langsung ditampilkan di frontend.
 */

const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');

// ── Supabase client ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kmhqsuzeuekgbpzumkno.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

let supabase = null;
const getSupabase = () => {
  if (!supabase) {
    if (!SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_SERVICE_KEY environment variable is not set');
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return supabase;
};

// ── Multer memory storage (tidak simpan ke disk) ───────────────────────────────
// Semua upload kategori pakai memoryStorage
const memoryStorage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedTypes.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Hanya file gambar (JPG, PNG, WEBP) yang diizinkan.'));
};

const paymentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedTypes.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Hanya file gambar (JPG, PNG) atau PDF yang diizinkan.'));
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Multer instances — semuanya pakai memoryStorage
const uploadStudio    = multer({ storage: memoryStorage, fileFilter: imageFilter,  limits: { fileSize: MAX_SIZE } });
const uploadEquipment = multer({ storage: memoryStorage, fileFilter: imageFilter,  limits: { fileSize: MAX_SIZE } });
const uploadBooking   = multer({ storage: memoryStorage, fileFilter: imageFilter,  limits: { fileSize: MAX_SIZE } });
const uploadPackage   = multer({ storage: memoryStorage, fileFilter: imageFilter,  limits: { fileSize: MAX_SIZE } });
const uploadPayment   = multer({ storage: memoryStorage, fileFilter: paymentFilter, limits: { fileSize: MAX_SIZE } });

// ── Upload helper ──────────────────────────────────────────────────────────────
/**
 * Upload file buffer ke Supabase Storage
 * @param {Buffer} buffer - File buffer dari multer memoryStorage
 * @param {string} folder - Subfolder di dalam bucket ('studios'|'equipment'|'bookings'|'packages'|'payments')
 * @param {string} originalname - Nama file asli (untuk ambil ekstensi)
 * @param {string} [bucket] - Nama bucket ('soundville-images' atau 'soundville-payments')
 * @returns {Promise<string>} Public URL dari file yang berhasil diupload
 */
const uploadToSupabase = async (buffer, folder, originalname, bucket = 'soundville-images') => {
  const sb = getSupabase();
  const ext = path.extname(originalname).toLowerCase();
  const uniqueName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const { error } = await sb.storage
    .from(bucket)
    .upload(uniqueName, buffer, {
      contentType: getMimeType(ext),
      upsert: false,
    });

  if (error) throw new Error(`Supabase Storage upload error: ${error.message}`);

  // Dapatkan public URL
  const { data } = sb.storage.from(bucket).getPublicUrl(uniqueName);
  return data.publicUrl;
};

/** Helper: Dapatkan MIME type dari ekstensi file */
const getMimeType = (ext) => {
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
  };
  return map[ext] || 'application/octet-stream';
};

module.exports = {
  uploadStudio,
  uploadEquipment,
  uploadBooking,
  uploadPackage,
  uploadPayment,
  uploadToSupabase,
};
