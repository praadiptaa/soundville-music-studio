-- ============================================================
-- DATABASE: soundville_db
-- Soundville Music Studio - Skema Database MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS soundville_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE soundville_db;

-- ------------------------------------------------------------
-- Tabel: users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id_user     INT AUTO_INCREMENT PRIMARY KEY,
  nama        VARCHAR(100)        NOT NULL,
  email       VARCHAR(100)        NOT NULL UNIQUE,
  password    VARCHAR(255)        NOT NULL,
  no_hp       VARCHAR(20)         DEFAULT NULL,
  role        ENUM('admin','customer') NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabel: studios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studios (
  id_studio     INT AUTO_INCREMENT PRIMARY KEY,
  nama_studio   VARCHAR(100)  NOT NULL,
  harga_per_jam DECIMAL(10,2) NOT NULL,
  deskripsi     TEXT          DEFAULT NULL,
  fasilitas     TEXT          DEFAULT NULL,
  foto          VARCHAR(255)  DEFAULT NULL,
  status        ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif'
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabel: bookings
-- ------------------------------------------------------------
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
  catatan_admin   TEXT          DEFAULT NULL,
  catatan_cancel  TEXT          DEFAULT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_user   FOREIGN KEY (id_user)   REFERENCES users(id_user)     ON DELETE CASCADE,
  CONSTRAINT fk_booking_studio FOREIGN KEY (id_studio) REFERENCES studios(id_studio) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabel: payments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id_payment      INT AUTO_INCREMENT PRIMARY KEY,
  id_booking      INT           NOT NULL UNIQUE,
  metode          VARCHAR(50)   NOT NULL DEFAULT 'transfer',
  bukti_transfer  VARCHAR(255)  DEFAULT NULL,
  status_payment  ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  tanggal_payment TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  catatan_admin   TEXT          DEFAULT NULL,
  tipe_pembayaran ENUM('dp', 'lunas') NOT NULL DEFAULT 'dp',
  CONSTRAINT fk_payment_booking FOREIGN KEY (id_booking) REFERENCES bookings(id_booking) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabel: event_services
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_services (
  id_service    INT AUTO_INCREMENT PRIMARY KEY,
  nama_service  VARCHAR(100)  NOT NULL,
  harga         DECIMAL(10,2) NOT NULL,
  deskripsi     TEXT          DEFAULT NULL,
  status        ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif'
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabel: events
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id_event            INT AUTO_INCREMENT PRIMARY KEY,
  id_user             INT           NOT NULL,
  nama_event          VARCHAR(150)  NOT NULL,
  tanggal_event       DATE          NOT NULL,
  tanggal_selesai     DATE          DEFAULT NULL,
  id_package          INT           DEFAULT NULL,
  paket_biaya_adjusted DECIMAL(10,2) DEFAULT NULL,
  tanggal_mulai_paket DATE          DEFAULT NULL,
  tanggal_selesai_paket DATE        DEFAULT NULL,
  jumlah_hari         INT           NOT NULL DEFAULT 1,
  lokasi_event        VARCHAR(200)  DEFAULT NULL,
  deskripsi           TEXT          DEFAULT NULL,
  status_event        ENUM('pending','approved','rejected','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  catatan_admin       TEXT          DEFAULT NULL,
  catatan_cancel      TEXT          DEFAULT NULL,
  created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_user FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE,
  CONSTRAINT fk_event_package FOREIGN KEY (id_package) REFERENCES event_packages(id_package) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabel: event_orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_orders (
  id_order      INT AUTO_INCREMENT PRIMARY KEY,
  id_event      INT           NOT NULL,
  id_service    INT           NOT NULL,
  qty           INT           NOT NULL DEFAULT 1,
  total_harga   DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_order_event   FOREIGN KEY (id_event)   REFERENCES events(id_event)           ON DELETE CASCADE,
  CONSTRAINT fk_order_service FOREIGN KEY (id_service) REFERENCES event_services(id_service) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabel: event_payments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_payments (
  id_event_payment INT AUTO_INCREMENT PRIMARY KEY,
  id_event         INT           NOT NULL UNIQUE,
  metode           VARCHAR(50)   NOT NULL DEFAULT 'transfer',
  bukti_transfer   VARCHAR(255)  DEFAULT NULL,
  status_payment   ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  tanggal_payment  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  catatan_admin    TEXT          DEFAULT NULL,
  CONSTRAINT fk_event_payment_event FOREIGN KEY (id_event) REFERENCES events(id_event) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DATA AWAL (SEED)
-- ============================================================

-- Admin default (password: admin123)
INSERT INTO users (nama, email, password, no_hp, role) VALUES
('Administrator', 'admin@soundville.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LfKRMGG12mW', '081234567890', 'admin');

-- Studio default
INSERT INTO studios (nama_studio, harga_per_jam, deskripsi, fasilitas, status) VALUES
('Studio A - Recording', 150000, 'Studio rekaman profesional dengan peralatan lengkap', 'Drum Kit, Guitar Amp, Bass Amp, Keyboard, Microphone, Headphone Monitor', 'aktif'),
('Studio B - Rehearsal', 100000, 'Studio latihan band dengan akustik yang baik', 'Drum Kit, Guitar Amp, Bass Amp, PA System', 'aktif'),
('Studio C - Podcast', 75000, 'Studio podcast dan vokal recording', 'Condenser Mic, Audio Interface, Pop Filter, Headphone', 'aktif');

-- Event services default
INSERT INTO event_services (nama_service, harga, deskripsi, status) VALUES
('Live Music Performance', 2500000, 'Penampilan live music oleh band atau musisi profesional', 'aktif'),
('Sound System Rental', 1500000, 'Penyewaan sound system lengkap untuk event', 'aktif'),
('MC & Host', 750000, 'Jasa MC profesional untuk acara Anda', 'aktif'),
('Lighting Setup', 1000000, 'Paket lighting dan dekorasi panggung', 'aktif'),
('Dokumentasi Foto & Video', 1200000, 'Jasa dokumentasi profesional foto dan video', 'aktif');
