import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { upload } from '../../middleware/upload';
import * as ctrl from './users.controller';

const router = Router();

router.use(authenticate);

router.get( '/me',                    ctrl.getMe);
router.patch('/me',                   ctrl.updateMe);
router.post('/me/change-password',    ctrl.changePassword);
router.post('/me/fcm-token',          ctrl.saveFcmToken);
router.post('/me/avatar',             upload.single('avatar'), ctrl.uploadAvatar);

export default router;
