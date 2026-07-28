const { Pool } = require('pg');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false }
});

// High Quality SVG Data URLs for Default Studio/Equipment Banners
const defaultStudioA = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231a1a24"/><stop offset="50%" stop-color="%232d1f3d"/><stop offset="100%" stop-color="%230f0f15"/></linearGradient></defs><rect width="800" height="500" fill="url(%23g1)"/><circle cx="400" cy="250" r="180" fill="%23eab308" opacity="0.1"/><g fill="none" stroke="%23eab308" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"><rect x="340" y="160" width="120" height="180" rx="60"/><path d="M400 340 v80 M340 420 h120"/></g><text x="400" y="110" font-family="sans-serif" font-weight="bold" font-size="32" fill="%23ffffff" text-anchor="middle">STUDIO A - SELF PRACTICE</text><text x="400" y="460" font-family="sans-serif" font-size="20" fill="%23eab308" text-anchor="middle">SOUNDVILLE MUSIC STUDIO</text></svg>`;

const defaultStudioB = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23151c24"/><stop offset="50%" stop-color="%231f2d3d"/><stop offset="100%" stop-color="%230f141a"/></linearGradient></defs><rect width="800" height="500" fill="url(%23g2)"/><circle cx="400" cy="250" r="180" fill="%233b82f6" opacity="0.1"/><g fill="none" stroke="%233b82f6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"><path d="M300 200 h200 v120 h-200 z M350 320 v80 M450 320 v80 M280 400 h240"/><circle cx="340" cy="250" r="25"/><circle cx="460" cy="250" r="25"/></g><text x="400" y="110" font-family="sans-serif" font-weight="bold" font-size="32" fill="%23ffffff" text-anchor="middle">STUDIO B - FULL BAND</text><text x="400" y="460" font-family="sans-serif" font-size="20" fill="%233b82f6" text-anchor="middle">SOUNDVILLE MUSIC STUDIO</text></svg>`;

async function run() {
  const client = await pool.connect();
  console.log('✅ Terhubung ke Supabase PostgreSQL...\n');

  // Update Studio A legacy image
  await client.query(
    `UPDATE studios SET foto = $1 WHERE id_studio = 1 AND (foto IS NULL OR foto NOT LIKE 'data:%' AND foto NOT LIKE 'http%')`,
    [defaultStudioA]
  );
  console.log('  ✅ Studio 1 foto updated to SVG banner');

  // Update Studio B legacy image
  await client.query(
    `UPDATE studios SET foto = $1 WHERE id_studio = 2 AND (foto IS NULL OR foto NOT LIKE 'data:%' AND foto NOT LIKE 'http%')`,
    [defaultStudioB]
  );
  console.log('  ✅ Studio 2 foto updated to SVG banner');

  client.release();
  console.log('\n🎉 Selesai mereset legacy studio images ke SVG Data URLs!');
  process.exit(0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
