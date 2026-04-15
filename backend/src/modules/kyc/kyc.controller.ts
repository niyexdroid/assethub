import { Request, Response, NextFunction } from 'express';
import { KycService } from './kyc.service';
import { bvnSchema, ninSchema, studentIdSchema, schoolEmailVerifySchema } from './kyc.validators';

const svc = new KycService();

export async function submitBvn(req: Request, res: Response, next: NextFunction) {
  try {
    const { bvn } = bvnSchema.parse(req.body);
    const result  = await svc.submitBvn(req.user!.id, bvn);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function submitNin(req: Request, res: Response, next: NextFunction) {
  try {
    const { nin } = ninSchema.parse(req.body);
    const result  = await svc.submitNin(req.user!.id, nin);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function submitStudentId(req: Request, res: Response, next: NextFunction) {
  try {
    const { school_name, school_email } = studentIdSchema.parse(req.body);
    const studentIdUrl = (req as any).file?.path;
    if (!studentIdUrl) return res.status(400).json({ error: 'Student ID file required' });
    const result = await svc.submitStudentId(req.user!.id, studentIdUrl, school_name, school_email);
    return res.json(result);
  } catch (err) { return next(err); }
}

export async function verifySchoolEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { otp } = schoolEmailVerifySchema.parse(req.body);
    const result  = await svc.verifySchoolEmail(req.user!.id, otp);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function getStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await svc.getStatus(req.user!.id);
    res.json(status);
  } catch (err) { return next(err); }
}
