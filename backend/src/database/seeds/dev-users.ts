/**
 * Dev seed — creates two test accounts for local testing.
 * Run with:  npx ts-node src/database/seeds/dev-users.ts
 *
 * Tenant  → phone: 08100000001  password: passwordtn
 * Landlord → phone: 08100000002  password: passwordld
 */

import bcrypt from 'bcryptjs';
import { pool } from '../../config/database';
import { normalizePhone } from '../../utils/phoneNormalizer';

async function seed() {
  const users = [
    {
      phone_number:  '08100000001',
      first_name:    'Test',
      last_name:     'Tenant',
      password:      'passwordtn',
      role:          'tenant',
      is_verified:   true,
      is_active:     true,
    },
    {
      phone_number:  '08100000002',
      first_name:    'Test',
      last_name:     'Landlord',
      password:      'passwordld',
      role:          'landlord',
      is_verified:   true,
      is_active:     true,
    },
  ];

  for (const u of users) {
    const hash  = await bcrypt.hash(u.password, 12);
    const phone = normalizePhone(u.phone_number);

    await pool.query(
      `INSERT INTO users
         (phone_number, first_name, last_name, password_hash, role, is_verified, is_active, package_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'standard')
       ON CONFLICT (phone_number) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role          = EXCLUDED.role,
             is_verified   = EXCLUDED.is_verified,
             is_active     = EXCLUDED.is_active`,
      [phone, u.first_name, u.last_name, hash, u.role, u.is_verified, u.is_active]
    );

    console.log(`✓ ${u.role} user seeded — ${phone} / ${u.password}`);
  }

  await pool.end();
  console.log('\nDone.');
}

seed().catch(err => { console.error(err); process.exit(1); });
