/// <reference path="./types/express.d.ts" />
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import kycRoutes from './modules/kyc/kyc.routes';
import paymentRoutes from './modules/payments/payments.routes';
import subaccountRoutes from './modules/payments/subaccount.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import propertyRoutes from './modules/properties/properties.routes';
import tenancyRoutes from './modules/tenancies/tenancies.routes';
import roommateRoutes from './modules/roommates/roommates.routes';
import complaintRoutes from './modules/complaints/complaints.routes';
import adminRoutes from './modules/admin/admin.routes';
import userRoutes  from './modules/users/users.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.NODE_ENV === 'production' ? false : '*' }));
app.use(express.json());

// Global rate limiter
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Stricter rate limiter for auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth',       authLimiter, authRoutes);
app.use('/api/v1/kyc',        kycRoutes);
app.use('/api/v1/payments',      paymentRoutes);
app.use('/api/v1/paystack',      subaccountRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/properties',   propertyRoutes);
app.use('/api/v1/tenancies',    tenancyRoutes);
app.use('/api/v1/roommates',    roommateRoutes);
app.use('/api/v1/complaints',   complaintRoutes);
app.use('/api/v1/admin',        adminRoutes);
app.use('/api/v1/users',        userRoutes);

app.use(errorHandler);

const PORT = Number(env.PORT);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
