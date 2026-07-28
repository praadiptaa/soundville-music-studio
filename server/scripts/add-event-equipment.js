const db = require('../config/database');

async function migrate() {
  try {
    console.log('🔧 Creating event_equipment table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS event_equipment (
        id_equipment INT AUTO_INCREMENT PRIMARY KEY,
        nama_alat VARCHAR(100) NOT NULL,
        spesifikasi TEXT,
        status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(nama_alat)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ event_equipment table created');

    console.log('🔧 Creating event_package_equipment table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS event_package_equipment (
        id_package INT NOT NULL,
        id_equipment INT NOT NULL,
        PRIMARY KEY (id_package, id_equipment),
        FOREIGN KEY (id_package) REFERENCES event_packages(id_package) ON DELETE CASCADE,
        FOREIGN KEY (id_equipment) REFERENCES event_equipment(id_equipment) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ event_package_equipment table created');

    console.log('🔧 Inserting sample equipment...');
    const equipment = [
      { nama: 'Microphone Condenser', spec: 'Rode NT1, 20Hz-20kHz' },
      { nama: 'Microphone Dinamis', spec: 'Shure SM7B, Cardioid' },
      { nama: 'Gitar Akustik', spec: 'Yamaha FG800, 41"' },
      { nama: 'Gitar Elektrik', spec: 'Fender Stratocaster' },
      { nama: 'Bass Guitar', spec: 'Fender Jazz Bass 5-String' },
      { nama: 'Keyboard', spec: 'Yamaha PSR-S770, 61 Keys' },
      { nama: 'Drum Kit', spec: 'Pearl Export, 5-piece' },
      { nama: 'Stand Microphone', spec: 'Atlas MS-4' },
      { nama: 'Sound Monitor', spec: 'Behringer B115D, 1000W' },
      { nama: 'Mixing Console', spec: 'Behringer X1832USB, 18 Input' },
      { nama: 'Speaker Aktif', spec: 'Mackie Thump12A, 1300W' },
      { nama: 'Amplifier Gitar', spec: 'Fender Mustang 200' },
    ];

    for (const eq of equipment) {
      try {
        await db.query(
          'INSERT INTO event_equipment (nama_alat, spesifikasi) VALUES (?, ?)',
          [eq.nama, eq.spec]
        );
        console.log(`  ✓ ${eq.nama}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`  ~ ${eq.nama} (sudah ada)`);
        } else {
          throw err;
        }
      }
    }
    console.log('✅ Sample equipment inserted');

    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
