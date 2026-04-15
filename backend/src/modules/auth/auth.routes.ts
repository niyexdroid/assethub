import { Router } from 'express';
import * as ctrl from './auth.controller';

const router = Router();

router.post('/register',        ctrl.register);
router.post('/login',           ctrl.login);
router.post('/refresh',         ctrl.refresh);
router.post('/logout',          ctrl.logout);
router.post('/login/otp',       ctrl.requestOtp);
router.post('/verify-otp',      ctrl.verifyOtp);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password',  ctrl.resetPassword);

export default router;
