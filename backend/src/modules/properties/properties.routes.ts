import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { upload } from '../../middleware/upload';
import * as ctrl from './properties.controller';

const router = Router();

// Public routes
router.get('/',     ctrl.search);
router.get('/saved',authenticate, ctrl.getSavedProperties);
router.get('/landlord/mine', authenticate, authorize('landlord'), ctrl.getLandlordProperties);
router.get('/:id',  ctrl.getById);

// Landlord routes
router.post('/',    authenticate, authorize('landlord'), ctrl.create);
router.put('/:id',  authenticate, authorize('landlord'), ctrl.update);
router.delete('/:id', authenticate, authorize('landlord'), ctrl.remove);
router.post('/:id/photos',  authenticate, authorize('landlord'), upload.array('photos', 10), ctrl.addPhotos);
router.delete('/:id/photos', authenticate, authorize('landlord'), ctrl.removePhoto);

// Tenant routes
router.post('/:id/save',   authenticate, authorize('tenant'), ctrl.saveProperty);
router.delete('/:id/save', authenticate, authorize('tenant'), ctrl.unsaveProperty);

export default router;
