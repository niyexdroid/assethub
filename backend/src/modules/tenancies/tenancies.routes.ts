import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './tenancies.controller';

const router = Router();

router.use(authenticate);

router.post('/',                         authorize('landlord'), ctrl.create);
router.get('/tenant/mine',               authorize('tenant'),   ctrl.getTenantTenancies);
router.get('/landlord/mine',             authorize('landlord'), ctrl.getLandlordTenancies);
router.get('/:id',                       ctrl.getById);
router.get('/:id/agreement',             ctrl.getAgreement);
router.put('/:id/accept',                authorize('tenant'),   ctrl.accept);
router.put('/:id/decline',               authorize('tenant'),   ctrl.decline);
router.put('/:id/terminate',             ctrl.terminate);
router.post('/:id/sign/tenant',          authorize('tenant'),   ctrl.signTenant);
router.post('/:id/sign/landlord',        authorize('landlord'), ctrl.signLandlord);

export default router;
