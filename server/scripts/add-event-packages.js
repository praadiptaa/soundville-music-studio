/**
 * Migration: Tambah tabel event_packages
 * Untuk mengelola paket event seperti studio packages
 */

const db = require('../config/database')

const migrate = async () => {
  try {
    console.log('[Migration] Creating event_packages table...')
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS event_packages (
        id_package INT AUTO_INCREMENT PRIMARY KEY,
        nama_paket VARCHAR(150) NOT NULL,
        harga DECIMAL(10,2) NOT NULL,
        deskripsi TEXT DEFAULT NULL,
        fasilitas TEXT DEFAULT NULL,
        durasi_hari INT DEFAULT 1,
        status ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `)

    console.log('✅ Table event_packages created')

    // Update events table untuk add id_package
    console.log('[Migration] Updating events table...')
    
    // Check if column already exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'events' AND COLUMN_NAME = 'id_package'
    `)

    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE events ADD COLUMN id_package INT DEFAULT NULL AFTER id_user
      `)
      
      await db.query(`
        ALTER TABLE events ADD CONSTRAINT fk_event_package 
        FOREIGN KEY (id_package) REFERENCES event_packages(id_package) ON DELETE SET NULL
      `)
    }

    console.log('✅ Events table updated')

    // Insert sample event packages
    console.log('[Migration] Inserting sample event packages...')
    
    await db.query(`
      INSERT IGNORE INTO event_packages (nama_paket, harga, deskripsi, fasilitas, durasi_hari, status) VALUES
      ('Paket Basic', 5000000, 'Paket event dasar dengan sound system dan lighting', 'Sound System Standar, Lighting Basic, MC', 1, 'aktif'),
      ('Paket Standar', 10000000, 'Paket event lengkap dengan profesional', 'Sound System Profesional, Lighting Profesional, MC, DJ, Dokumentasi', 1, 'aktif'),
      ('Paket Premium', 20000000, 'Paket event eksklusif dengan semua fasilitas premium', 'Sound System Premium, Lighting Profesional, MC, DJ, Band, Dokumentasi 4K, Dekorasi', 2, 'aktif'),
      ('Paket Corporate', 15000000, 'Paket khusus untuk acara korporat', 'Sound System Profesional, Lighting Bisnis, MC, Dokumentasi, Setup Profesional', 1, 'aktif')
    `)

    console.log('✅ Sample event packages inserted')
    console.log('✅ Migration successful!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  }
}

migrate()
