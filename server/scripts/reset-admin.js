require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
  console.log('\n=== RESET PASSWORD ADMIN SOUNDVILLE ===\n');
  console.log('Konfigurasi dari .env:');
  console.log('  Host    :', process.env.DB_HOST);
  console.log('  Port    :', process.env.DB_PORT);
  console.log('  User    :', process.env.DB_USER);
  console.log('  Password:', process.env.DB_PASSWORD === '' ? '(kosong)' : '***');
  console.log('  Database:', process.env.DB_NAME);
  console.log('');

  let conn;
  try {
    // Coba konek tanpa database dulu untuk memastikan MySQL jalan
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    console.log('✅ Koneksi MySQL berhasil!\n');

    // Buat database jika belum ada
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'soundville_db'}\` CHARACTER SET utf8mb4`);
    await conn.query(`USE \`${process.env.DB_NAME || 'soundville_db'}\``);
    console.log('✅ Database siap\n');

    // Buat tabel users jika belum ada
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id_user    INT AUTO_INCREMENT PRIMARY KEY,
        nama       VARCHAR(100) NOT NULL,
        email      VARCHAR(100) NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        no_hp      VARCHAR(20)  DEFAULT NULL,
        role       ENUM('admin','customer') NOT NULL DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
    console.log('✅ Tabel users siap\n');

    // Generate hash baru untuk admin123
    const hash = await bcrypt.hash('admin123', 10);
    console.log('✅ Hash baru dibuat\n');

    // Cek apakah admin sudah ada
    const [rows] = await conn.query(
      "SELECT id_user, email, role FROM users WHERE email = 'admin@soundville.com'"
    );

    if (rows.length === 0) {
      // Insert admin baru
      await conn.query(
        "INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, ?)",
        ['Administrator', 'admin@soundville.com', hash, '081234567890', 'admin']
      );
      console.log('✅ Akun admin BERHASIL DIBUAT!\n');
    } else {
      // Update password admin
      await conn.query(
        "UPDATE users SET password = ?, role = 'admin', nama = 'Administrator' WHERE email = 'admin@soundville.com'",
        [hash]
      );
      console.log('✅ Password admin BERHASIL DI-RESET!\n');
    }

    // Verifikasi
    const [verify] = await conn.query(
      "SELECT id_user, nama, email, role, password FROM users WHERE email = 'admin@soundville.com'"
    );
    const admin = verify[0];
    const isMatch = await bcrypt.compare('admin123', admin.password);

    console.log('=== HASIL VERIFIKASI ===');
    console.log('  ID      :', admin.id_user);
    console.log('  Nama    :', admin.nama);
    console.log('  Email   :', admin.email);
    console.log('  Role    :', admin.role);
    console.log('  Pass OK :', isMatch ? '✅ COCOK' : '❌ TIDAK COCOK');
    console.log('');

    if (isMatch) {
      console.log('=======================================');
      console.log('  ✅ LOGIN ADMIN SIAP DIGUNAKAN!');
      console.log('  Email   : admin@soundville.com');
      console.log('  Password: admin123');
      console.log('=======================================\n');
    }

    await conn.end();
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error('   Code  :', err.code || '-');
    console.error('\n--- SOLUSI ---');
    if (err.code === 'ECONNREFUSED') {
      console.error('MySQL tidak bisa diakses di port', process.env.DB_PORT || 3306);
      console.error('1. Buka Laragon, klik tombol START');
      console.error('2. Pastikan MySQL service nyala (lampu hijau)');
      console.error('3. Coba ganti DB_PORT di .env (coba 3306 atau 3307)');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Username/password MySQL salah');
      console.error('1. Cek DB_USER dan DB_PASSWORD di server/.env');
      console.error('2. Default Laragon: user=root, password=(kosong)');
    } else {
      console.error('Periksa konfigurasi .env dan pastikan Laragon berjalan');
    }
    process.exit(1);
  }
})();
