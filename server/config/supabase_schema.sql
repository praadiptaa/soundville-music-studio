-- ============================================================
-- SOUNDVILLE MUSIC STUDIO - SUPABASE (POSTGRESQL) SCHEMA
-- Salin dan tempel (paste) seluruh query ini ke SQL Editor di Dashboard Supabase Anda, lalu klik "Run".
-- ============================================================

-- 1. Tipe Enum (Kategori / Status)
DO $$ BEGIN
    CREATE TYPE role_type AS ENUM ('admin', 'customer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_aktif_type AS ENUM ('aktif', 'nonaktif');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_booking_type AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_payment_type AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipe_pembayaran_type AS ENUM ('dp', 'lunas');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_event_type AS ENUM ('pending', 'approved', 'rejected', 'confirmed', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Tabel Users
CREATE TABLE IF NOT EXISTS users (
  id_user     SERIAL PRIMARY KEY,
  nama        VARCHAR(100)        NOT NULL,
  email       VARCHAR(100)        NOT NULL UNIQUE,
  password    VARCHAR(255)        NOT NULL,
  no_hp       VARCHAR(20)         DEFAULT NULL,
  role        role_type           NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Studios
CREATE TABLE IF NOT EXISTS studios (
  id_studio     SERIAL PRIMARY KEY,
  nama_studio   VARCHAR(100)  NOT NULL,
  harga_per_jam DECIMAL(10,2) NOT NULL,
  deskripsi     TEXT          DEFAULT NULL,
  fasilitas     TEXT          DEFAULT NULL,
  foto          VARCHAR(255)  DEFAULT NULL,
  status        status_aktif_type NOT NULL DEFAULT 'aktif'
);

-- 4. Tabel Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id_booking      SERIAL PRIMARY KEY,
  id_user         INT           NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
  id_studio       INT           NOT NULL REFERENCES studios(id_studio) ON DELETE CASCADE,
  tanggal         DATE          NOT NULL,
  jam_mulai       TIME          NOT NULL,
  jam_selesai     TIME          NOT NULL,
  total_harga     DECIMAL(10,2) DEFAULT 0,
  status_booking  status_booking_type NOT NULL DEFAULT 'pending',
  catatan         TEXT          DEFAULT NULL,
  catatan_admin   TEXT          DEFAULT NULL,
  catatan_cancel  TEXT          DEFAULT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Payments
CREATE TABLE IF NOT EXISTS payments (
  id_payment      SERIAL PRIMARY KEY,
  id_booking      INT           NOT NULL UNIQUE REFERENCES bookings(id_booking) ON DELETE CASCADE,
  metode          VARCHAR(50)   NOT NULL DEFAULT 'transfer',
  bukti_transfer  VARCHAR(255)  DEFAULT NULL,
  status_payment  status_payment_type NOT NULL DEFAULT 'pending',
  tanggal_payment TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  catatan_admin   TEXT          DEFAULT NULL,
  tipe_pembayaran tipe_pembayaran_type NOT NULL DEFAULT 'dp'
);

-- 6. Tabel Event Packages
CREATE TABLE IF NOT EXISTS event_packages (
  id_package  SERIAL PRIMARY KEY,
  nama_paket  VARCHAR(100)  NOT NULL,
  harga       DECIMAL(10,2) NOT NULL,
  deskripsi   TEXT          DEFAULT NULL,
  fasilitas   TEXT          DEFAULT NULL,
  durasi_hari INT           NOT NULL DEFAULT 1,
  gambar      VARCHAR(255)  DEFAULT NULL,
  status      status_aktif_type NOT NULL DEFAULT 'aktif'
);

-- 7. Tabel Event Equipment
CREATE TABLE IF NOT EXISTS event_equipment (
  id_equipment SERIAL PRIMARY KEY,
  nama_alat    VARCHAR(100)  NOT NULL,
  spesifikasi  TEXT          DEFAULT NULL,
  harga_sewa   DECIMAL(10,2) DEFAULT NULL,
  durasi_hari  INT           NOT NULL DEFAULT 1,
  gambar       VARCHAR(255)  DEFAULT NULL,
  status       status_aktif_type NOT NULL DEFAULT 'aktif'
);

-- 8. Tabel Relasi Package Equipment
CREATE TABLE IF NOT EXISTS event_package_equipment (
  id_package   INT NOT NULL REFERENCES event_packages(id_package) ON DELETE CASCADE,
  id_equipment INT NOT NULL REFERENCES event_equipment(id_equipment) ON DELETE CASCADE,
  PRIMARY KEY (id_package, id_equipment)
);

-- 9. Tabel Event Services
CREATE TABLE IF NOT EXISTS event_services (
  id_service    SERIAL PRIMARY KEY,
  nama_service  VARCHAR(100)  NOT NULL,
  harga         DECIMAL(10,2) NOT NULL,
  deskripsi     TEXT          DEFAULT NULL,
  status        status_aktif_type NOT NULL DEFAULT 'aktif'
);

-- 10. Tabel Events
CREATE TABLE IF NOT EXISTS events (
  id_event            SERIAL PRIMARY KEY,
  id_user             INT           NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
  nama_event          VARCHAR(150)  NOT NULL,
  tanggal_event       DATE          NOT NULL,
  tanggal_selesai     DATE          DEFAULT NULL,
  id_package          INT           DEFAULT NULL REFERENCES event_packages(id_package) ON DELETE SET NULL,
  paket_biaya_adjusted DECIMAL(10,2) DEFAULT NULL,
  tanggal_mulai_paket DATE          DEFAULT NULL,
  tanggal_selesai_paket DATE        DEFAULT NULL,
  jumlah_hari         INT           NOT NULL DEFAULT 1,
  lokasi_event        VARCHAR(200)  DEFAULT NULL,
  deskripsi           TEXT          DEFAULT NULL,
  status_event        status_event_type NOT NULL DEFAULT 'pending',
  catatan_admin       TEXT          DEFAULT NULL,
  catatan_cancel      TEXT          DEFAULT NULL,
  created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tabel Event Orders (Service Items)
CREATE TABLE IF NOT EXISTS event_orders (
  id_order      SERIAL PRIMARY KEY,
  id_event      INT           NOT NULL REFERENCES events(id_event) ON DELETE CASCADE,
  id_service    INT           NOT NULL REFERENCES event_services(id_service) ON DELETE CASCADE,
  qty           INT           NOT NULL DEFAULT 1,
  total_harga   DECIMAL(10,2) NOT NULL
);

-- 12. Tabel Event Rentals (Equipment Items)
CREATE TABLE IF NOT EXISTS event_rentals (
  id_rental     SERIAL PRIMARY KEY,
  id_event      INT           NOT NULL REFERENCES events(id_event) ON DELETE CASCADE,
  id_equipment  INT           NOT NULL REFERENCES event_equipment(id_equipment) ON DELETE CASCADE,
  qty           INT           NOT NULL DEFAULT 1,
  harga_satuan  DECIMAL(10,2) NOT NULL,
  total_harga   DECIMAL(10,2) NOT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- 13. Tabel Event Payments
CREATE TABLE IF NOT EXISTS event_payments (
  id_event_payment SERIAL PRIMARY KEY,
  id_event         INT           NOT NULL UNIQUE REFERENCES events(id_event) ON DELETE CASCADE,
  metode           VARCHAR(50)   NOT NULL DEFAULT 'transfer',
  bukti_transfer   VARCHAR(255)  DEFAULT NULL,
  status_payment   status_payment_type NOT NULL DEFAULT 'pending',
  tanggal_payment  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  catatan_admin    TEXT          DEFAULT NULL,
  tipe_pembayaran  tipe_pembayaran_type NOT NULL DEFAULT 'dp'
);

-- ============================================================
-- DATA AWAL (SEEDING)
-- ============================================================

-- Seed User Admin Default (password: admin123)
INSERT INTO users (nama, email, password, no_hp, role) VALUES
('Administrator', 'admin@soundville.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LfKRMGG12mW', '081234567890', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Seed Studios Default
INSERT INTO studios (nama_studio, harga_per_jam, deskripsi, fasilitas, status) VALUES
('Studio A - Recording', 150000, 'Studio rekaman profesional dengan peralatan lengkap', 'Drum Kit, Guitar Amp, Bass Amp, Keyboard, Microphone, Headphone Monitor', 'aktif'),
('Studio B - Rehearsal', 100000, 'Studio latihan band dengan akustik yang baik', 'Drum Kit, Guitar Amp, Bass Amp, PA System', 'aktif'),
('Studio C - Podcast', 75000, 'Studio podcast dan vokal recording', 'Condenser Mic, Audio Interface, Pop Filter, Headphone', 'aktif');

-- Seed Event Services Default
INSERT INTO event_services (nama_service, harga, deskripsi, status) VALUES
('Live Music Performance', 2500000, 'Penampilan live music oleh band atau musisi profesional', 'aktif'),
('Sound System Rental', 1500000, 'Penyewaan sound system lengkap untuk event', 'aktif'),
('MC & Host', 750000, 'Jasa MC profesional untuk acara Anda', 'aktif'),
('Lighting Setup', 1000000, 'Paket lighting dan dekorasi panggung', 'aktif'),
('Dokumentasi Foto & Video', 1200000, 'Jasa dokumentasi profesional foto dan video', 'aktif');
