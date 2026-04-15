import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service';
import { initPaymentSchema, verifyPaymentSchema } from './payments.validators';

const svc = new PaymentsService();

export async function initialize(req: Request, res: Response, next: NextFunction) {
  try {
    const input  = initPaymentSchema.parse(req.body);
    const result = await svc.initializePayment(req.user!.id, input);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function verify(req: Request, res: Response, next: NextFunction) {
  try {
    const { reference } = verifyPaymentSchema.parse({ reference: req.params.reference });
    const result        = await svc.verifyPayment(reference);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function getSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await svc.getSchedule(req.params.tenancyId, req.user!.id);
    res.json(rows);
  } catch (err) { return next(err); }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 20;
    const rows  = await svc.getHistory(req.user!.id, page, limit);
    res.json(rows);
  } catch (err) { return next(err); }
}

export async function getTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    const tx = await svc.getTransaction(req.params.id, req.user!.id);
    res.json(tx);
  } catch (err) { return next(err); }
}
