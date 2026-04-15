import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { upload } from '../../middleware/upload';
import * as ctrl from './kyc.controller';

const router = Router();

router.use(authenticate);

router.post('/bvn',                 ctrl.submitBvn);
router.post('/nin',                 ctrl.submitNin);
router.post('/student-id',          upload.single('student_id'), ctrl.submitStudentId);
router.post('/verify-school-email', ctrl.verifySchoolEmail);
router.get('/status',               ctrl.getStatus);

export default router;
