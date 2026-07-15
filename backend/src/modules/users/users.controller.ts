import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { updateProfileSchema, changePasswordSchema, changePhoneRequestSchema, changePhoneVerifySchema } from './users.validators';
import { uploadFile } from '../../services/upload.service';
import { NotificationsService } from '../notifications/notifications.service';

const svc = new UsersService();
const notifSvc = new NotificationsService();

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await svc.getProfile(req.user!.id);
    res.json(user);
  } catch (err) { next(err); }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateProfileSchema.parse(req.body);
    const user  = await svc.updateProfile(req.user!.id, input);
    res.json(user);
  } catch (err) { next(err); }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const input  = changePasswordSchema.parse(req.body);
    const result = await svc.changePassword(req.user!.id, input);
    res.json(result);
  } catch (err) { next(err); }
}

export async function requestPhoneChange(req: Request, res: Response, next: NextFunction) {
  try {
    const input = changePhoneRequestSchema.parse(req.body);
    const { otp, phone } = await svc.requestPhoneChange(req.user!.id, input);
    // Send OTP to user's email for verification (phone change is sensitive)
    await notifSvc.sendOtp(req.user!.id, req.user!.email, otp);
    res.json({ message: 'OTP sent to your email. Use it to verify your new phone number.' });
  } catch (err) { next(err); }
}

export async function verifyPhoneChange(req: Request, res: Response, next: NextFunction) {
  try {
    const input = changePhoneVerifySchema.parse(req.body);
    const user  = await svc.verifyPhoneChange(req.user!.id, input);
    res.json(user);
  } catch (err) { next(err); }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    const file = (req as any).file as Express.Multer.File;
    if (!file) { res.status(400).json({ error: 'No file uploaded' }); return; }

    const { url } = await uploadFile(file.buffer, file.originalname, 'avatars');
    const user    = await svc.updateProfile(req.user!.id, { avatar_url: url } as any);
    res.json({ avatar_url: url, user });
  } catch (err) { next(err); }
}

export async function saveFcmToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'token required' }); return;
    }
    await svc.saveFcmToken(req.user!.id, token);
    res.json({ success: true });
  } catch (err) { next(err); }
}
