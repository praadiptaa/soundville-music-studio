/**
 * Migration: Tambah harga_sewa dan durasi_hari ke event_equipment
 * Untuk menyimpan biaya sewa alat dan durasi standar
 */

const db = require('../config/database')

const migrate = async () => {
  try {
    console.log('[Migration] Adding harga_sewa and durasi_hari to event_equipment table...')
    
    // Check if columns already exist
    const [columns] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'event_equipment' AND (COLUMN_NAME = 'harga_sewa' OR COLUMN_NAME = 'durasi_hari')
    `)

    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE event_equipment 
        ADD COLUMN harga_sewa DECIMAL(10,2) DEFAULT NULL AFTER spesifikasi,
        ADD COLUMN durasi_hari INT DEFAULT 1 AFTER harga_sewa
      `)
      console.log('✅ Columns harga_sewa and durasi_hari added to event_equipment table')
    } else {
      console.log('⚠️  Columns already exist')
    }

    console.log('✅ Migration successful!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  }
}

migrate()
