/**
 * Migration: Buat tabel event_rentals untuk menyimpan alat yang dipilih customer
 */

const db = require('../config/database')

const migrate = async () => {
  try {
    console.log('[Migration] Creating event_rentals table...')
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS event_rentals (
        id_rental INT AUTO_INCREMENT PRIMARY KEY,
        id_event INT NOT NULL,
        id_equipment INT NOT NULL,
        qty INT NOT NULL DEFAULT 1,
        harga_satuan DECIMAL(10,2) NOT NULL,
        total_harga DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_rental_event FOREIGN KEY (id_event) REFERENCES events(id_event) ON DELETE CASCADE,
        CONSTRAINT fk_rental_equipment FOREIGN KEY (id_equipment) REFERENCES event_equipment(id_equipment) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    
    console.log('✅ event_rentals table created successfully')
    console.log('✅ Migration successful!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  }
}

migrate()
