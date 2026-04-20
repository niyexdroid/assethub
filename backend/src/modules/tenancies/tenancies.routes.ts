import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './tenancies.controller';

const router = Router();

router.use(authenticate);

router.post('/',                                  authorize('landlord'), ctrl.create);
router.get('/tenant/mine',                        authorize('tenant'),   ctrl.getTenantTenancies);
router.get('/landlord/mine',                      authorize('landlord'), ctrl.getLandlordTenancies);

// Applications
router.post('/apply',                             authorize('tenant'),   ctrl.apply);
router.get('/applications/mine',                  authorize('tenant'),   ctrl.getMyApplications);
router.get('/applications/received',              authorize('landlord'), ctrl.getReceivedApplications);
router.put('/applications/:id/approve',           authorize('landlord'), ctrl.approveApplication);
router.put('/applications/:id/reject',            authorize('landlord'), ctrl.rejectApplication);

router.get('/:id',                                ctrl.getById);
router.get('/:id/agreement',                      ctrl.getAgreement);
router.put('/:id/accept',                         authorize('tenant'),   ctrl.accept);
router.put('/:id/decline',                        authorize('tenant'),   ctrl.decline);
router.put('/:id/terminate',                      ctrl.terminate);
router.post('/:id/sign/tenant',                   authorize('tenant'),   ctrl.signTenant);
router.post('/:id/sign/landlord',                 authorize('landlord'), ctrl.signLandlord);

export default router;
