import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './complaints.controller';

const router = Router();

router.use(authenticate);

router.post('/',                  ctrl.create);
router.get('/',                   ctrl.list);
router.get('/:id',                ctrl.getById);
router.post('/:id/messages',      ctrl.addMessage);
router.put('/:id/escalate',       ctrl.escalate);
router.put('/:id/resolve',        ctrl.resolve);

export default router;
