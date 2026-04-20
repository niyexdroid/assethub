import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './admin.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

// Users
router.get('/users',                  ctrl.listUsers);
router.get('/users/:id',              ctrl.getUser);

// KYC
router.get('/kyc/pending',            ctrl.listPendingKyc);
router.put('/kyc/:userId/approve',    ctrl.approveKyc);
router.put('/kyc/:userId/reject',     ctrl.rejectKyc);

// Properties
router.get('/properties/pending',     ctrl.listPendingProperties);
router.get('/properties',             ctrl.listAllProperties);
router.put('/properties/:id/approve', ctrl.approveProperty);
router.put('/properties/:id/reject',  ctrl.rejectProperty);
router.put('/properties/:id/suspend', ctrl.suspendProperty);

// Complaints
router.get('/complaints',             ctrl.listEscalatedComplaints);
router.put('/complaints/:id/resolve', ctrl.adminResolveComplaint);

// Transactions & Reports
router.get('/transactions',           ctrl.listTransactions);
router.get('/reports/revenue',        ctrl.revenueReport);

// Platform Settings
router.get('/settings',               ctrl.getSettings);
router.put('/settings/:key',          ctrl.updateSetting);

// Audit Logs
router.get('/audit-logs',             ctrl.getAuditLogs);

export default router;
