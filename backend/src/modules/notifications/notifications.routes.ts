import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './notifications.controller';

const router = Router();

router.use(authenticate);

router.get('/',              ctrl.list);
router.put('/read-all',      ctrl.markAllRead);
router.put('/:id/read',      ctrl.markRead);
router.put('/preferences',   ctrl.updatePreferences);

export default router;
