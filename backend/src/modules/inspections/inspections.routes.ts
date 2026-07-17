import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './inspections.controller';

const router = Router();

router.use(authenticate);

router.post('/',                        ctrl.createReport);
router.get('/',                         ctrl.list);
router.get('/:id',                      ctrl.getById);
router.post('/:id/items',               ctrl.addItem);
router.put('/:id/items/:itemId',        ctrl.updateItem);
router.delete('/:id/items/:itemId',     ctrl.deleteItem);
router.put('/:id/submit',               ctrl.submitReport);
router.put('/:id/sign',                 ctrl.sign);
router.put('/:id/dispute',              ctrl.dispute);
router.delete('/:id',                   ctrl.deleteReport);

export default router;
