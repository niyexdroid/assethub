import { Router } from 'express';
import express from 'express';
import { authenticate } from '../../middleware/authenticate';
import { paystackWebhook } from './webhook.handler';
import * as ctrl from './payments.controller';

const router = Router();

/**
 * Webhook must receive the RAW body buffer for HMAC signature verification.
 * It is registered BEFORE the express.json() middleware on this route.
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paystackWebhook
);

// All routes below require authentication
router.use(authenticate);

router.post('/initialize',                ctrl.initialize);
router.get('/verify/:reference',          ctrl.verify);
router.get('/schedule/:tenancyId',        ctrl.getSchedule);
router.get('/history',                    ctrl.getHistory);
router.get('/history/:id',                ctrl.getTransaction);

export default router;
