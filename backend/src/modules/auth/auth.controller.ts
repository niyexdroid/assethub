import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { loginSchema, loginVerifySchema, completeProfileSchema, googleAuthSchema, googleCompleteSchema, refreshSchema } from './auth.validators';

const svc = new AuthService();

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input  = loginSchema.parse(req.body);
    const { login_token } = await svc.login(input);
    res.json({ login_token });
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

export async function completeProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const input  = completeProfileSchema.parse(req.body);
    const result = await svc.completeProfile(input);
    res.status(201).json(result);
  } catch (err) { return next(err); }
}

export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const { idToken, code, redirectUri } = googleAuthSchema.parse(req.body);
    const result = await svc.googleAuth(idToken, code, redirectUri);
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

export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
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
