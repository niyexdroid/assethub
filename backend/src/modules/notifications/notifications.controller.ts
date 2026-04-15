import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { NotificationsService } from './notifications.service';

const svc = new NotificationsService();

const prefsSchema = z.object({
  whatsapp_opt_in: z.boolean(),
  fcm_token:       z.string().optional(),
});

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 30;
    const rows  = await svc.list(req.user!.id, page, limit);
    res.json(rows);
  } catch (err) { return next(err); }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.markRead(req.params.id, req.user!.id);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.markAllRead(req.user!.id);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

export async function updatePreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const { whatsapp_opt_in, fcm_token } = prefsSchema.parse(req.body);
    await svc.updatePreferences(req.user!.id, whatsapp_opt_in, fcm_token);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}
