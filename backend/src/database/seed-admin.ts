/**
 * Production admin seed — idempotent, runs at container startup.
 * Only inserts admin if no admin user exists yet.
 */
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';

async function seed() {
  const { rows } = await pool.query(`SELECT 1 FROM users WHERE role = 'admin' LIMIT 1`);
  if (rows.length > 0) {
    console.log('[seed] Admin user already exists, skipping.');
    await pool.end();
    return;
  }

  const admin = {
    email: process.env.ADMIN_EMAIL || 'admin@assethub.com',
    password: process.env.ADMIN_PASSWORD || 'admin123!@#',
  };

  const hash = await bcrypt.hash(admin.password, 12);

  await pool.query(
    `INSERT INTO users (email, first_name, last_name, password_hash, role, is_verified, is_active, package_type)
     VALUES ($1, $2, $3, $4, 'admin', true, true, 'standard')
     ON CONFLICT (email) DO NOTHING`,
    [admin.email, 'Admin', 'User', hash],
  );

  console.log(`[seed] Admin user created: ${admin.email}`);
  await pool.end();
}

seed().catch(err => { console.error('[seed] Admin seed failed:', err.message); process.exit(1); });
