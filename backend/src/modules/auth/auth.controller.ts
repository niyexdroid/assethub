import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema, loginVerifySchema, googleAuthSchema, googleCompleteSchema, refreshSchema, resetRequestSchema, resetPasswordSchema, verifyEmailSchema, resendVerificationSchema } from './auth.validators';

const svc = new AuthService();

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input  = registerSchema.parse(req.body);
    const { email } = await svc.register(input);
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
    const result = await svc.resendVerification(email);
    res.json(result);
  } catch (err) { return next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input  = loginSchema.parse(req.body);
    const { requiresOtp, login_token } = await svc.login(input);
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
    const result = await svc.requestPasswordReset(email);
    res.json(result);
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

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const accessToken = header?.startsWith('Bearer ') ? header.slice(7) : '';
    const { refresh_token } = req.body || {};
    await svc.logout(accessToken, refresh_token);
    res.json({ message: 'Logged out' });
  } catch (err) { return next(err); }
}
