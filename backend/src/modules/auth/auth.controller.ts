import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { NotificationsService } from '../notifications/notifications.service';

const notifSvc = new NotificationsService();
import {
  registerSchema, loginSchema, otpVerifySchema,
  otpRequestSchema, refreshSchema, resetRequestSchema, resetPasswordSchema
} from './auth.validators';

const svc = new AuthService();

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input   = registerSchema.parse(req.body);
    const { user, otp } = await svc.register(input);
    await notifSvc.sendOtp(user.id, user.phone_number, otp);
    res.status(201).json({ message: 'Registration successful. Verify your phone number.', user });
  } catch (err) { return next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const data  = await svc.login(input);
    res.json(data);
  } catch (err) { return next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refresh_token } = refreshSchema.parse(req.body);
    const tokens = await svc.refresh(refresh_token);
    res.json(tokens);
  } catch (err) { return next(err); }
}

export async function requestOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone_number } = otpRequestSchema.parse(req.body);
    const { phone, otp }  = await svc.requestOtp(phone_number);
    // userId unknown at this point — fetch it
    const { rows } = await (await import('../../config/database')).pool.query(
      'SELECT id FROM users WHERE phone_number = $1', [phone]
    );
    if (rows[0]) await notifSvc.sendOtp(rows[0].id, phone, otp);
    res.json({ message: 'OTP sent' });
  } catch (err) { return next(err); }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone_number, otp } = otpVerifySchema.parse(req.body);
    const result = await svc.verifyPhone(phone_number, otp);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone_number } = resetRequestSchema.parse(req.body);
    await svc.requestOtp(phone_number);
    // TODO: send OTP via NotificationService
    res.json({ message: 'OTP sent' });
  } catch (err) { return next(err); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const input  = resetPasswordSchema.parse(req.body);
    const result = await svc.resetPassword(input);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function logout(_req: Request, res: Response) {
  // Stateless JWT — client discards tokens.
  // Future: add refresh token to a Redis blocklist here.
  res.json({ message: 'Logged out' });
}
