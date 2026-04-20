import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AdminService } from './admin.service';

const svc = new AdminService();

const rejectSchema  = z.object({ reason: z.string().min(5) });
const resolveSchema = z.object({ resolution_notes: z.string().min(5) });
const settingSchema = z.object({ value: z.string().min(1) });

// ── Users ───────────────────────────────────────────────────────────────────

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 30;
    const role  = req.query.role as string | undefined;
    res.json(await svc.listUsers(page, limit, role));
  } catch (err) { return next(err); }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getUser(req.params.id));
  } catch (err) { return next(err); }
}

// ── KYC ─────────────────────────────────────────────────────────────────────

export async function listPendingKyc(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.listPendingKyc());
  } catch (err) { return next(err); }
}

export async function approveKyc(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.approveKyc(req.params.userId, req.user!.id);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

export async function rejectKyc(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = rejectSchema.parse(req.body);
    await svc.rejectKyc(req.params.userId, req.user!.id, reason);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

// ── Properties ───────────────────────────────────────────────────────────────

export async function listPendingProperties(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.listPendingProperties());
  } catch (err) { return next(err); }
}

export async function listAllProperties(req: Request, res: Response, next: NextFunction) {
  try {
    const page   = Number(req.query.page)   || 1;
    const limit  = Number(req.query.limit)  || 50;
    const status = req.query.status as string | undefined;
    res.json(await svc.listAllProperties(page, limit, status));
  } catch (err) { return next(err); }
}

export async function approveProperty(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.approveProperty(req.params.id, req.user!.id);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

export async function rejectProperty(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = rejectSchema.parse(req.body);
    await svc.rejectProperty(req.params.id, req.user!.id, reason);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

export async function suspendProperty(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.suspendProperty(req.params.id, req.user!.id);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

// ── Complaints ───────────────────────────────────────────────────────────────

export async function listEscalatedComplaints(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.listEscalatedComplaints());
  } catch (err) { return next(err); }
}

export async function adminResolveComplaint(req: Request, res: Response, next: NextFunction) {
  try {
    const { resolution_notes } = resolveSchema.parse(req.body);
    await svc.adminResolveComplaint(req.params.id, req.user!.id, resolution_notes);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

// ── Transactions ─────────────────────────────────────────────────────────────

export async function listTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const page   = Number(req.query.page)   || 1;
    const limit  = Number(req.query.limit)  || 50;
    const status = req.query.status as string | undefined;
    res.json(await svc.listTransactions(page, limit, status));
  } catch (err) { return next(err); }
}

export async function revenueReport(req: Request, res: Response, next: NextFunction) {
  try {
    const from = req.query.from as string || new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
    const to   = req.query.to   as string || new Date().toISOString().split('T')[0];
    res.json(await svc.revenueReport(from, to));
  } catch (err) { return next(err); }
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getSettings());
  } catch (err) { return next(err); }
}

export async function updateSetting(req: Request, res: Response, next: NextFunction) {
  try {
    const { value } = settingSchema.parse(req.body);
    await svc.updateSetting(req.params.key, value, req.user!.id);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

// ── Audit Logs ────────────────────────────────────────────────────────────────

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 50;
    res.json(await svc.getAuditLogs(page, limit));
  } catch (err) { return next(err); }
}
