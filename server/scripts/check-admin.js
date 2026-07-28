const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({ connectionString: poolerUrl, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Supabase\n');

    // 1. Cek data users
    const users = await client.query('SELECT id_user, nama, email, role, password FROM users ORDER BY id_user LIMIT 10');
    console.log(`Total users: ${users.rows.length}`);
    
    if (users.rows.length === 0) {
      console.log('\n❌ TIDAK ADA USER DI DATABASE! Perlu insert admin default.\n');
      
      // Insert admin default
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        `INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
        ['Admin Soundville', 'admin@soundville.com', hashedPassword, 'admin']
      );
      console.log('✅ Admin default berhasil dibuat!');
      console.log('   Email   : admin@soundville.com');
      console.log('   Password: admin123');
    } else {
      console.log('\nDaftar user:');
      for (const u of users.rows) {
        console.log(`  [${u.id_user}] ${u.email} (${u.role})`);
        
        // Cek apakah password 'admin123' cocok
        if (u.email === 'admin@soundville.com') {
          const match = await bcrypt.compare('admin123', u.password);
          console.log(`  ↳ Test password 'admin123': ${match ? '✅ COCOK' : '❌ TIDAK COCOK'}`);
          
          if (!match) {
            // Reset password admin
            const newHash = await bcrypt.hash('admin123', 10);
            await client.query('UPDATE users SET password = $1 WHERE email = $2', [newHash, 'admin@soundville.com']);
            console.log(`  ↳ Password admin sudah direset ke 'admin123'`);
          }
        }
      }
    }

    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
