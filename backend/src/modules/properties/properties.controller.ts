import { Request, Response, NextFunction } from 'express';
import { PropertiesService } from './properties.service';
import { searchProperties } from './properties.search';
import { createPropertySchema, updatePropertySchema, searchSchema } from './properties.validators';
import { uploadFile } from '../../services/upload.service';

const svc = new PropertiesService();

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input    = createPropertySchema.parse(req.body);
    const property = await svc.create(req.user!.id, input);
    res.status(201).json(property);
  } catch (err) { return next(err); }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = searchSchema.parse(req.query);
    const result  = await searchProperties(filters);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const property = await svc.getById(req.params.id);
    res.json(property);
  } catch (err) { return next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input    = updatePropertySchema.parse(req.body);
    const property = await svc.update(req.params.id, req.user!.id, input);
    res.json(property);
  } catch (err) { return next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.delete(req.params.id, req.user!.id);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

export async function addPhotos(req: Request, res: Response, next: NextFunction) {
  try {
    const files = (req as any).files as Express.Multer.File[];
    if (!files?.length) return res.status(400).json({ error: 'No files uploaded' });

    const uploads = await Promise.all(
      files.map(f => uploadFile(f.buffer, f.originalname, 'properties'))
    );
    const urls   = uploads.map(u => u.url);
    const photos = await svc.addPhotos(req.params.id, req.user!.id, urls);
    return res.json({ photos });
  } catch (err) { return next(err); }
}

export async function removePhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl) return res.status(400).json({ error: 'photoUrl required' });
    const photos = await svc.removePhoto(req.params.id, req.user!.id, photoUrl);
    return res.json({ photos });
  } catch (err) { return next(err); }
}

export async function getLandlordProperties(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await svc.getLandlordProperties(req.user!.id);
    res.json(rows);
  } catch (err) { return next(err); }
}

export async function saveProperty(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.saveProperty(req.user!.id, req.params.id);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

export async function unsaveProperty(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.unsaveProperty(req.user!.id, req.params.id);
    res.json({ ok: true });
  } catch (err) { return next(err); }
}

export async function getSavedProperties(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await svc.getSavedProperties(req.user!.id);
    res.json(rows);
  } catch (err) { return next(err); }
}
