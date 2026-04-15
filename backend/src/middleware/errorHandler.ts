import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const firstMsg = err.errors[0]?.message ?? 'Validation failed';
    return res.status(422).json({ message: firstMsg, error: 'Validation failed', details: err.errors });
  }

  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (status >= 500) logger.error(err);

  return res.status(status).json({ message, error: message });
}
