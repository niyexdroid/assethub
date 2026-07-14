import { Router } from 'express';
import * as ctrl from './auth.controller';

const router = Router();

router.post('/login',                ctrl.login);
router.post('/login/verify',         ctrl.verifyLoginOtp);
router.post('/login/resend',         ctrl.resendLoginOtp);
router.post('/complete-profile',     ctrl.completeProfile);
router.post('/refresh',              ctrl.refresh);
router.post('/logout',               ctrl.logout);
router.post('/google',               ctrl.googleAuth);
router.post('/google/complete',      ctrl.googleComplete);
router.post('/admin/login',          ctrl.adminLogin);

export default router;
