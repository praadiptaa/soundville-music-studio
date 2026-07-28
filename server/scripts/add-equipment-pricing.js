const db = require('../config/database');

async function migrate() {
  try {
    console.log('🔧 Adding rental price and duration columns to event_equipment table...');
    
    // Add harga_sewa column
    try {
      await db.query(`
        ALTER TABLE event_equipment 
        ADD COLUMN harga_sewa DECIMAL(10,2) DEFAULT 0 AFTER spesifikasi
      `);
      console.log('✅ harga_sewa column added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('  ~ harga_sewa column already exists');
      } else {
        throw err;
      }
    }

    // Add durasi_hari column
    try {
      await db.query(`
        ALTER TABLE event_equipment 
        ADD COLUMN durasi_hari INT DEFAULT 1 AFTER harga_sewa
      `);
      console.log('✅ durasi_hari column added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('  ~ durasi_hari column already exists');
      } else {
        throw err;
      }
    }

    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
