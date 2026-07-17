import { Request, Response, NextFunction } from 'express';
import { InspectionsService } from './inspections.service';
import {
  createReportSchema, addItemSchema, updateItemSchema,
  signReportSchema, disputeReportSchema,
} from './inspections.validator';
import { uploadFile } from '../../services/upload.service';

const svc = new InspectionsService();

export async function uploadPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw Object.assign(new Error('No photo uploaded'), { status: 400 });
    const result = await uploadFile(req.file.buffer, req.file.originalname, 'properties');
    res.status(201).json({ url: result.url });
  } catch (err) { return next(err); }
}

export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createReportSchema.parse(req.body);
    const report = await svc.createReport(req.user!.id, input);
    res.status(201).json(report);
  } catch (err) { return next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.list(req.user!.id));
  } catch (err) { return next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getById(req.params.id, req.user!.id));
  } catch (err) { return next(err); }
}

export async function addItem(req: Request, res: Response, next: NextFunction) {
  try {
    const input = addItemSchema.parse(req.body);
    res.status(201).json(await svc.addItem(req.params.id, req.user!.id, input));
  } catch (err) { return next(err); }
}

export async function updateItem(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateItemSchema.parse(req.body);
    res.json(await svc.updateItem(req.params.itemId, req.params.id, req.user!.id, input));
  } catch (err) { return next(err); }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deleteItem(req.params.itemId, req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) { return next(err); }
}

export async function submitReport(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.submitForReview(req.params.id, req.user!.id));
  } catch (err) { return next(err); }
}

export async function sign(req: Request, res: Response, next: NextFunction) {
  try {
    const input = signReportSchema.parse(req.body);
    res.json(await svc.sign(req.params.id, req.user!.id, input));
  } catch (err) { return next(err); }
}

export async function dispute(req: Request, res: Response, next: NextFunction) {
  try {
    const input = disputeReportSchema.parse(req.body);
    res.json(await svc.dispute(req.params.id, req.user!.id, input));
  } catch (err) { return next(err); }
}

export async function deleteReport(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deleteReport(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) { return next(err); }
}
