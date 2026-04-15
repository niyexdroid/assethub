import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RoommatesService } from './roommates.service';
import { roommateProfileSchema, matchRequestSchema } from './roommates.validators';

const svc = new RoommatesService();

export async function upsertProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const input   = roommateProfileSchema.parse(req.body);
    const profile = await svc.upsertProfile(req.user!.id, input);
    res.json(profile);
  } catch (err) { return next(err); }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await svc.getProfile(req.user!.id);
    if (!profile) return res.status(404).json({ error: 'No roommate profile found' });
    return res.json(profile);
  } catch (err) { return next(err); }
}

export async function deactivateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deactivateProfile(req.user!.id);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

export async function getMatches(req: Request, res: Response, next: NextFunction) {
  try {
    const { propertyId } = z.object({ propertyId: z.string().uuid() }).parse(req.params);
    const result = await svc.getMatches(req.user!.id, propertyId);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function sendRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const input  = matchRequestSchema.parse(req.body);
    const result = await svc.sendRequest(req.user!.id, input);
    res.status(201).json(result);
  } catch (err) { return next(err); }
}

export async function acceptRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.respondToRequest(req.params.id, req.user!.id, 'accept');
    res.json(result);
  } catch (err) { return next(err); }
}

export async function declineRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.respondToRequest(req.params.id, req.user!.id, 'decline');
    res.json(result);
  } catch (err) { return next(err); }
}

export async function getReceivedRequests(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getReceivedRequests(req.user!.id));
  } catch (err) { return next(err); }
}

export async function getSentRequests(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getSentRequests(req.user!.id));
  } catch (err) { return next(err); }
}
