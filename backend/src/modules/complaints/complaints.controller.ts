import { Request, Response, NextFunction } from 'express';
import { ComplaintsService } from './complaints.service';
import { createComplaintSchema, addMessageSchema, resolveSchema } from './complaints.validators';

const svc = new ComplaintsService();

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input     = createComplaintSchema.parse(req.body);
    const complaint = await svc.create(req.user!.id, input);
    res.status(201).json(complaint);
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

export async function addMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { message, attachments } = addMessageSchema.parse(req.body);
    res.status(201).json(await svc.addMessage(req.params.id, req.user!.id, message, attachments));
  } catch (err) { return next(err); }
}

export async function escalate(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.escalate(req.params.id, req.user!.id));
  } catch (err) { return next(err); }
}

export async function resolve(req: Request, res: Response, next: NextFunction) {
  try {
    const { resolution_notes } = resolveSchema.parse(req.body);
    res.json(await svc.resolve(req.params.id, req.user!.id, resolution_notes));
  } catch (err) { return next(err); }
}
