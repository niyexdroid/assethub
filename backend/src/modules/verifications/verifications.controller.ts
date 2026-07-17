import { Request, Response, NextFunction } from 'express';
import { VerificationsService } from './verifications.service';
import { submitVerificationSchema, rejectVerificationSchema } from './verifications.validator';

const svc = new VerificationsService();

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    const input = submitVerificationSchema.parse(req.body);
    res.status(201).json(await svc.submit(req.user!.id, input));
  } catch (err) { return next(err); }
}

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.listByLandlord(req.user!.id));
  } catch (err) { return next(err); }
}

export async function listPending(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.listPending());
  } catch (err) { return next(err); }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.approve(req.params.id, req.user!.id));
  } catch (err) { return next(err); }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const input = rejectVerificationSchema.parse(req.body);
    res.json(await svc.reject(req.params.id, req.user!.id, input));
  } catch (err) { return next(err); }
}
