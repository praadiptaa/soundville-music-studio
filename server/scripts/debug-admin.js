/**
 * Script Debug Admin Login
 * Jalankan: node scripts/debug-admin.js
 */
require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function debugAdmin() {
  console.log('=== DEBUG ADMIN LOGIN ===\n');

  // 1. Test koneksi MySQL
  let conn;
  try {
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'soundville_db',
    });
    console.log('✅ Koneksi MySQL berhasil\n');
  } catch (err) {
    console.error('❌ Koneksi MySQL GAGAL:', err.message);
    console.error('   Code :', err.code);
    console.error('\nSolusi:');
    console.error('  - Pastikan Laragon sudah dijalankan');
    console.error('  - Pastikan MySQL service sudah Start');
    console.error('  - Cek DB_PORT di .env (coba 3306 atau 3307)');
    process.exit(1);
  }

  // 2. Cek database ada
  try {
    const [dbs] = await conn.query("SHOW DATABASES LIKE 'soundville_db'");
    if (dbs.length === 0) {
      console.error('❌ Database soundville_db TIDAK ADA!');
      console.error('   Jalankan: npm run db:setup');
      process.exit(1);
    }
    console.log('✅ Database soundville_db ada\n');
  } catch (err) {
    console.error('❌ Error cek database:', err.message);
  }

  // 3. Cek tabel users
  try {
    const [tables] = await conn.query("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      console.error('❌ Tabel users TIDAK ADA!');
      console.error('   Jalankan: npm run db:setup');
      process.exit(1);
    }
    console.log('✅ Tabel users ada\n');
  } catch (err) {
    console.error('❌ Error cek tabel:', err.message);
  }

  // 4. Cek data admin di database
  try {
    const [rows] = await conn.query("SELECT id_user, nama, email, role, password FROM users WHERE email = 'admin@soundville.com'");
    if (rows.length === 0) {
      console.error('❌ Akun admin TIDAK ADA di database!');
      console.log('\n--- Membuat ulang admin... ---');

      // Buat hash baru
      const hash = await bcrypt.hash('admin123', 10);
      await conn.query(
        "INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, ?)",
        ['Administrator', 'admin@soundville.com', hash, '081234567890', 'admin']
      );
      console.log('✅ Admin berhasil dibuat!');
      console.log('   Email   : admin@soundville.com');
      console.log('   Password: admin123\n');

      // Baca ulang
      const [newRows] = await conn.query("SELECT id_user, nama, email, role FROM users WHERE email = 'admin@soundville.com'");
      console.log('Data admin:', newRows[0]);
    } else {
      const admin = rows[0];
      console.log('✅ Akun admin ditemukan:');
      console.log('   ID   :', admin.id_user);
      console.log('   Nama :', admin.nama);
      console.log('   Email:', admin.email);
      console.log('   Role :', admin.role);
      console.log('   Hash :', admin.password.substring(0, 20) + '...\n');

      // 5. Test password match
      const match = await bcrypt.compare('admin123', admin.password);
      if (match) {
        console.log('✅ Password "admin123" COCOK dengan hash di database\n');
        console.log('============================================');
        console.log('  LOGIN SEHARUSNYA BERHASIL!');
        console.log('  Jika masih gagal, kemungkinan masalah ada');
        console.log('  di frontend atau koneksi API proxy.');
        console.log('============================================');
        console.log('\nCek browser console (F12) untuk error detail.');
        console.log('Pastikan backend berjalan di port 5000.');
        console.log('Pastikan frontend berjalan di port 3000.');
      } else {
        console.error('❌ Password "admin123" TIDAK COCOK dengan hash di database!');
        console.log('\n--- Memperbarui password admin... ---');
        const newHash = await bcrypt.hash('admin123', 10);
        await conn.query("UPDATE users SET password = ? WHERE email = 'admin@soundville.com'", [newHash]);
        console.log('✅ Password admin berhasil direset!');
        console.log('   Email   : admin@soundville.com');
        console.log('   Password: admin123');
      }
    }
  } catch (err) {
    console.error('❌ Error cek admin:', err.message);
  }

  // 6. Cek semua user
  try {
    const [allUsers] = await conn.query("SELECT id_user, nama, email, role FROM users");
    console.log(`\n📋 Total user di database: ${allUsers.length}`);
    allUsers.forEach(u => {
      console.log(`   [${u.role.toUpperCase()}] ${u.nama} - ${u.email}`);
    });
  } catch (err) {}

  // 7. Test API endpoint
  console.log('\n--- Test API Backend ---');
  console.log('Coba akses: http://localhost:5000');
  console.log('Atau test login via curl:');
  console.log(`  curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@soundville.com\\",\\"password\\":\\"admin123\\"}"`);

  await conn.end();
}

debugAdmin();
