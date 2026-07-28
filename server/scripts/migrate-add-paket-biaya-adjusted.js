/**
 * Migration: Tambah kolom paket_biaya_adjusted di events table
 * Untuk menyimpan harga paket yang sudah disesuaikan berdasarkan tanggal yang dipilih customer
 */

const db = require('../config/database')

const migrate = async () => {
  try {
    console.log('[Migration] Adding paket_biaya_adjusted column to events table...')
    
    // Check if column already exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'events' AND COLUMN_NAME = 'paket_biaya_adjusted'
    `)

    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE events ADD COLUMN paket_biaya_adjusted DECIMAL(10,2) DEFAULT NULL
        AFTER id_package
      `)
      console.log('✅ Column paket_biaya_adjusted added to events table')
    } else {
      console.log('⚠️  Column paket_biaya_adjusted already exists')
    }

    console.log('✅ Migration successful!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  }
}

migrate()
