const { Pool } = require('pg');

const projectRef = 'kmhqsuzeuekgbpzumkno';
const password = 'smsbugenvil2025';

const regions = ['ap-southeast-1', 'us-east-1', 'eu-central-1', 'us-west-1', 'ap-northeast-1'];
const ports = [6543, 5432];
const users = [`postgres.${projectRef}`, `postgres`];

async function tryConnect(region, port, user) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const uri = `postgresql://${user}:${password}@${host}:${port}/postgres`;
  const pool = new Pool({ connectionString: uri, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 3000 });
  try {
    const client = await pool.connect();
    console.log(`\n🎉 BERHASIL KONEK! URI: ${uri}`);
    const res = await client.query('SELECT count(*) FROM users');
    console.log('Jumlah user di database:', res.rows[0].count);
    client.release();
    process.exit(0);
  } catch (err) {
    console.log(`- Fail [${region}:${port} user:${user}]: ${err.message}`);
  } finally {
    pool.end();
  }
}

async function run() {
  console.log('Searching for working Supabase Pooler URI...');
  for (const user of users) {
    for (const region of regions) {
      for (const port of ports) {
        await tryConnect(region, port, user);
      }
    }
  }
}

run();
