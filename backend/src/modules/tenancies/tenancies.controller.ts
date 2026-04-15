import { Request, Response, NextFunction } from 'express';
import { TenanciesService } from './tenancies.service';
import { createTenancySchema, signSchema } from './tenancies.validators';
import { z } from 'zod';

const svc = new TenanciesService();

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input   = createTenancySchema.parse(req.body);
    const tenancy = await svc.create(req.user!.id, input);
    res.status(201).json(tenancy);
  } catch (err) { return next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const tenancy = await svc.getById(req.params.id, req.user!.id);
    res.json(tenancy);
  } catch (err) { return next(err); }
}

export async function getTenantTenancies(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getTenantTenancies(req.user!.id));
  } catch (err) { return next(err); }
}

export async function getLandlordTenancies(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getLandlordTenancies(req.user!.id));
  } catch (err) { return next(err); }
}

export async function accept(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.accept(req.params.id, req.user!.id));
  } catch (err) { return next(err); }
}

export async function decline(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.decline(req.params.id, req.user!.id);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

export async function terminate(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = z.object({ reason: z.string().min(5) }).parse(req.body);
    res.json(await svc.terminate(req.params.id, req.user!.id, reason));
  } catch (err) { return next(err); }
}

export async function getAgreement(req: Request, res: Response, next: NextFunction) {
  try {
    const pdf = await svc.getAgreementPdf(req.params.id, req.user!.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="agreement-${req.params.id}.pdf"`);
    res.send(pdf);
  } catch (err) { return next(err); }
}

export async function signTenant(req: Request, res: Response, next: NextFunction) {
  try {
    signSchema.parse(req.body);
    res.json(await svc.sign(req.params.id, req.user!.id, 'tenant'));
  } catch (err) { return next(err); }
}

export async function signLandlord(req: Request, res: Response, next: NextFunction) {
  try {
    signSchema.parse(req.body);
    res.json(await svc.sign(req.params.id, req.user!.id, 'landlord'));
  } catch (err) { return next(err); }
}
