/**
 * Script Setup Database Soundville
 * Jalankan: node scripts/setup-database.js
 *
 * Script ini akan:
 * 1. Konek ke MySQL (tanpa nama database)
 * 2. Buat database soundville_db jika belum ada
 * 3. Buat semua tabel
 * 4. Insert data awal (admin + studio + event services)
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
};

const DB_NAME = process.env.DB_NAME || 'soundville_db';

const SQL_TABLES = `
CREATE TABLE IF NOT EXISTS users (
  id_user     INT AUTO_INCREMENT PRIMARY KEY,
  nama        VARCHAR(100)             NOT NULL,
  email       VARCHAR(100)             NOT NULL UNIQUE,
  password    VARCHAR(255)             NOT NULL,
  no_hp       VARCHAR(20)              DEFAULT NULL,
  role        ENUM('admin','customer') NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMP                DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS studios (
  id_studio     INT AUTO_INCREMENT PRIMARY KEY,
  nama_studio   VARCHAR(100)            NOT NULL,
  harga_per_jam DECIMAL(10,2)           NOT NULL,
  deskripsi     TEXT                    DEFAULT NULL,
  fasilitas     TEXT                    DEFAULT NULL,
  foto          VARCHAR(255)            DEFAULT NULL,
  status        ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id_booking      INT AUTO_INCREMENT PRIMARY KEY,
  id_user         INT           NOT NULL,
  id_studio       INT           NOT NULL,
  tanggal         DATE          NOT NULL,
  jam_mulai       TIME          NOT NULL,
  jam_selesai     TIME          NOT NULL,
  total_harga     DECIMAL(10,2) DEFAULT 0,
  status_booking  ENUM('pending','confirmed','rejected','cancelled') NOT NULL DEFAULT 'pending',
  catatan         TEXT          DEFAULT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_user   FOREIGN KEY (id_user)   REFERENCES users(id_user)     ON DELETE CASCADE,
  CONSTRAINT fk_booking_studio FOREIGN KEY (id_studio) REFERENCES studios(id_studio) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id_payment      INT AUTO_INCREMENT PRIMARY KEY,
  id_booking      INT           NOT NULL UNIQUE,
  metode          VARCHAR(50)   NOT NULL DEFAULT 'transfer',
  bukti_transfer  VARCHAR(255)  DEFAULT NULL,
  status_payment  ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  tanggal_payment TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  catatan_admin   TEXT          DEFAULT NULL,
  CONSTRAINT fk_payment_booking FOREIGN KEY (id_booking) REFERENCES bookings(id_booking) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS event_services (
  id_service    INT AUTO_INCREMENT PRIMARY KEY,
  nama_service  VARCHAR(100)            NOT NULL,
  harga         DECIMAL(10,2)           NOT NULL,
  deskripsi     TEXT                    DEFAULT NULL,
  status        ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
  id_event      INT AUTO_INCREMENT PRIMARY KEY,
  id_user       INT           NOT NULL,
  nama_event    VARCHAR(150)  NOT NULL,
  tanggal_event DATE          NOT NULL,
  lokasi_event  VARCHAR(200)  DEFAULT NULL,
  deskripsi     TEXT          DEFAULT NULL,
  status_event  ENUM('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_user FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS event_orders (
  id_order      INT AUTO_INCREMENT PRIMARY KEY,
  id_event      INT           NOT NULL,
  id_service    INT           NOT NULL,
  qty           INT           NOT NULL DEFAULT 1,
  total_harga   DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_order_event   FOREIGN KEY (id_event)   REFERENCES events(id_event)           ON DELETE CASCADE,
  CONSTRAINT fk_order_service FOREIGN KEY (id_service) REFERENCES event_services(id_service) ON DELETE CASCADE
) ENGINE=InnoDB;
`;

async function setupDatabase() {
  let connection;

  console.log('================================================');
  console.log('  Soundville Music Studio - Database Setup');
  console.log('================================================');
  console.log(`Host     : ${DB_CONFIG.host}`);
  console.log(`Port     : ${DB_CONFIG.port}`);
  console.log(`User     : ${DB_CONFIG.user}`);
  console.log(`Password : ${DB_CONFIG.password === '' ? '(kosong)' : '***'}`);
  console.log(`Database : ${DB_NAME}`);
  console.log('------------------------------------------------');

  try {
    // Step 1: Konek ke MySQL tanpa nama database
    console.log('\n[1/4] Menghubungkan ke MySQL...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('      ✅ Berhasil konek ke MySQL!');

    // Step 2: Buat database
    console.log(`\n[2/4] Membuat database '${DB_NAME}'...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`      ✅ Database '${DB_NAME}' siap!`);

    // Step 3: Pilih database dan buat tabel
    console.log('\n[3/4] Membuat tabel-tabel...');
    await connection.query(`USE \`${DB_NAME}\``);

    const statements = SQL_TABLES
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await connection.query(stmt);
    }
    console.log('      ✅ Semua tabel berhasil dibuat!');
    console.log('         - users');
    console.log('         - studios');
    console.log('         - bookings');
    console.log('         - payments');
    console.log('         - event_services');
    console.log('         - events');
    console.log('         - event_orders');

    // Step 4: Insert data awal (hanya jika belum ada)
    console.log('\n[4/4] Memasukkan data awal...');

    // Cek admin
    const [adminRows] = await connection.query("SELECT id_user FROM users WHERE email = 'admin@soundville.com'");
    if (adminRows.length === 0) {
      // password: admin123 (sudah di-hash dengan bcrypt)
      await connection.query(
        `INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, ?)`,
        ['Administrator', 'admin@soundville.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LfKRMGG12mW', '081234567890', 'admin']
      );
      console.log('      ✅ Akun admin dibuat (admin@soundville.com / admin123)');
    } else {
      console.log('      ℹ️  Akun admin sudah ada, dilewati');
    }

    // Cek studio
    const [studioRows] = await connection.query("SELECT id_studio FROM studios LIMIT 1");
    if (studioRows.length === 0) {
      await connection.query(
        `INSERT INTO studios (nama_studio, harga_per_jam, deskripsi, fasilitas, status) VALUES
         ('Studio A - Recording', 150000, 'Studio rekaman profesional dengan peralatan lengkap', 'Drum Kit, Guitar Amp, Bass Amp, Keyboard, Microphone, Headphone Monitor', 'aktif'),
         ('Studio B - Rehearsal', 100000, 'Studio latihan band dengan akustik yang baik', 'Drum Kit, Guitar Amp, Bass Amp, PA System', 'aktif'),
         ('Studio C - Podcast', 75000, 'Studio podcast dan vokal recording', 'Condenser Mic, Audio Interface, Pop Filter, Headphone', 'aktif')`
      );
      console.log('      ✅ 3 studio awal berhasil ditambahkan');
    } else {
      console.log('      ℹ️  Data studio sudah ada, dilewati');
    }

    // Cek event services
    const [svcRows] = await connection.query("SELECT id_service FROM event_services LIMIT 1");
    if (svcRows.length === 0) {
      await connection.query(
        `INSERT INTO event_services (nama_service, harga, deskripsi, status) VALUES
         ('Live Music Performance', 2500000, 'Penampilan live music oleh band atau musisi profesional', 'aktif'),
         ('Sound System Rental', 1500000, 'Penyewaan sound system lengkap untuk event', 'aktif'),
         ('MC & Host', 750000, 'Jasa MC profesional untuk acara Anda', 'aktif'),
         ('Lighting Setup', 1000000, 'Paket lighting dan dekorasi panggung', 'aktif'),
         ('Dokumentasi Foto & Video', 1200000, 'Jasa dokumentasi profesional foto dan video', 'aktif')`
      );
      console.log('      ✅ 5 event service awal berhasil ditambahkan');
    } else {
      console.log('      ℹ️  Data event services sudah ada, dilewati');
    }

    console.log('\n================================================');
    console.log('  ✅ SETUP DATABASE SELESAI!');
    console.log('================================================');
    console.log('\nLangkah selanjutnya:');
    console.log('  1. Jalankan backend : cd server && npm run dev');
    console.log('  2. Jalankan frontend: cd client && npm run dev');
    console.log('\nLogin Admin:');
    console.log('  Email    : admin@soundville.com');
    console.log('  Password : admin123');
    console.log('================================================\n');

  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error('\nPastikan:');
    console.error('  1. Laragon/XAMPP sudah dijalankan');
    console.error('  2. MySQL/MariaDB service sudah aktif (klik Start di Laragon)');
    console.error('  3. Port MySQL benar (default: 3306)');
    console.error('  4. Username/password benar (default Laragon: root / kosong)');
    console.error('\nJika port Laragon berbeda, edit file server/.env:');
    console.error('  DB_PORT=3306  <- ganti dengan port yang dipakai Laragon');
    console.error('\nDetail error:', err.code || err.errno);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setupDatabase();
