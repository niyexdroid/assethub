import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { pool } from '../../config/database';
import { registerSchema, loginSchema, loginVerifySchema, googleAuthSchema, googleCompleteSchema, refreshSchema, resetRequestSchema, resetPasswordSchema, verifyEmailSchema, resendVerificationSchema } from './auth.validators';

const svc      = new AuthService();
const notifSvc = new NotificationsService();

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input  = registerSchema.parse(req.body);
    const { email, otp } = await svc.register(input);
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    notifSvc.sendOtp(rows[0].id, email, otp).catch(() => {});
    res.status(201).json({ email });
  } catch (err) { return next(err); }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp } = verifyEmailSchema.parse(req.body);
    const result = await svc.verifyEmail(email, otp);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = resendVerificationSchema.parse(req.body);
    const { otp, userId } = await svc.resendVerification(email);
    notifSvc.sendOtp(userId, email, otp).catch(() => {});
    res.json({ message: 'Verification code resent.' });
  } catch (err) { return next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input  = loginSchema.parse(req.body);
    const { requiresOtp, login_token, email, userId, otp } = await svc.login(input);
    // Fire-and-forget — don't block the response waiting for SMTP
    notifSvc.sendOtp(userId, email, otp).catch(() => {});
    res.json({ requiresOtp, login_token });
  } catch (err) { return next(err); }
}

export async function resendLoginOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { login_token } = req.body;
    if (!login_token) return res.status(400).json({ message: 'login_token required' });
    const data = await svc.resendLoginOtp(login_token);
    res.json(data);
  } catch (err) { return next(err); }
}

export async function verifyLoginOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { login_token, otp } = loginVerifySchema.parse(req.body);
    const data = await svc.verifyLoginOtp(login_token, otp);
    res.json(data);
  } catch (err) { return next(err); }
}

export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const { idToken } = googleAuthSchema.parse(req.body);
    const result = await svc.googleAuth(idToken);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function googleComplete(req: Request, res: Response, next: NextFunction) {
  try {
    const input  = googleCompleteSchema.parse(req.body);
    const result = await svc.googleComplete(input);
    res.status(201).json(result);
  } catch (err) { return next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refresh_token } = refreshSchema.parse(req.body);
    const tokens = await svc.refresh(refresh_token);
    res.json(tokens);
  } catch (err) { return next(err); }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = resetRequestSchema.parse(req.body);
    const { rows }  = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (rows[0]) {
      const { otp } = await svc.requestPasswordReset(email);
      notifSvc.sendOtp(rows[0].id, email, otp).catch(() => {});
    }
    // Always return success to prevent email enumeration
    res.json({ message: 'If that email is registered, a reset code has been sent.' });
  } catch (err) { return next(err); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const input  = resetPasswordSchema.parse(req.body);
    const result = await svc.resetPassword(input);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await svc.adminLogin(email, password);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function logout(_req: Request, res: Response) {
  res.json({ message: 'Logged out' });
}
