import { Router } from 'express';
import * as ctrl from './auth.controller';

const router = Router();

router.post('/register',             ctrl.register);
router.post('/verify-email',         ctrl.verifyEmail);
router.post('/resend-verification',  ctrl.resendVerification);
router.post('/login',                ctrl.login);
router.post('/login/verify',    ctrl.verifyLoginOtp);
router.post('/login/resend',    ctrl.resendLoginOtp);
router.post('/refresh',         ctrl.refresh);
router.post('/logout',          ctrl.logout);
router.post('/google',          ctrl.googleAuth);
router.post('/google/complete', ctrl.googleComplete);
router.post('/admin/login',      ctrl.adminLogin);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password',  ctrl.resetPassword);

export default router;
