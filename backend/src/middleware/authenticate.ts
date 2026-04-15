import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/strategies/jwt.strategy';
import { pool } from '../config/database';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const token   = header.slice(7);
    const payload = verifyAccessToken(token);

    // Lightweight check — confirm user still exists and is active
    const { rows } = await pool.query(
      'SELECT id, role, package_type FROM users WHERE id = $1 AND is_active = true',
      [payload.sub]
    );
    if (!rows[0]) return res.status(401).json({ error: 'User not found or deactivated' });

    req.user = rows[0];
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
