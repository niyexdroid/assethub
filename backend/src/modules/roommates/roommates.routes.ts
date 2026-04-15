import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './roommates.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('tenant')); // Roommate matching is tenant-only

router.post('/profile',                      ctrl.upsertProfile);
router.get('/profile',                       ctrl.getProfile);
router.delete('/profile',                    ctrl.deactivateProfile);

router.get('/matches/:propertyId',           ctrl.getMatches);

router.post('/request',                      ctrl.sendRequest);
router.put('/request/:id/accept',            ctrl.acceptRequest);
router.put('/request/:id/decline',           ctrl.declineRequest);
router.get('/requests/received',             ctrl.getReceivedRequests);
router.get('/requests/sent',                 ctrl.getSentRequests);

export default router;
