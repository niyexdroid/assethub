import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './verifications.controller';

const router = Router();

router.use(authenticate);

// Landlord routes
router.post('/', ctrl.submit);
router.get('/',  ctrl.listMine);

// Admin review routes
router.get('/pending',       authorize('admin'), ctrl.listPending);
router.put('/:id/approve',   authorize('admin'), ctrl.approve);
router.put('/:id/reject',    authorize('admin'), ctrl.reject);

export default router;
