const db = require('../config/database');

(async () => {
  try {
    console.log('Adding gambar column to event_equipment table...');
    
    await db.query(`
      ALTER TABLE event_equipment 
      ADD COLUMN gambar VARCHAR(255) NULL 
      AFTER durasi_hari
    `);
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log('✅ Column gambar already exists');
      process.exit(0);
    }
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
