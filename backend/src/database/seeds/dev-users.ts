/**
 * Dev seed — creates two test accounts for local testing.
 * Run with:  npx ts-node src/database/seeds/dev-users.ts
 *
 * Tenant   → email: niyexdroid@gmail.com   password: passwordtn
 * Landlord → email: niyexdroid@outlook.com password: passwordld
 * Admin    → email: admin@dev.assethub    password: passwordad
 */

import bcrypt from 'bcryptjs';
import { pool } from '../../config/database';

async function seed() {
  const users = [
    {
      email:       'niyexdroid@gmail.com',
      first_name:  'Test',
      last_name:   'Tenant',
      password:    'passwordtn',
      role:        'tenant',
    },
    {
      email:       'niyexdroid@outlook.com',
      first_name:  'Test',
      last_name:   'Landlord',
      password:    'passwordld',
      role:        'landlord',
    },
    {
      email:       'admin@dev.assethub',
      first_name:  'Test',
      last_name:   'Admin',
      password:    'passwordad',
      role:        'admin',
    },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);

    await pool.query(
      `INSERT INTO users (email, first_name, last_name, password_hash, role, is_verified, is_active, package_type)
       VALUES ($1, $2, $3, $4, $5, true, true, 'standard')
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role          = EXCLUDED.role,
             is_verified   = EXCLUDED.is_verified,
             is_active     = EXCLUDED.is_active`,
      [u.email, u.first_name, u.last_name, hash, u.role]
    );

    console.log(`✓ ${u.role} seeded — ${u.email} / ${u.password}`);
  }

  await pool.end();
  console.log('\nDone.');
}

seed().catch(err => { console.error(err); process.exit(1); });
