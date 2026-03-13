import { type Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { apiRateLimiter, authRateLimiter } from '../middleware/rate-limiter.js';

import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import customerRoutes from './customer.routes.js';
import vehiclesRoutes from './vehicles.routes.js';
import bookTestDriveRoutes from './bookTestDrive.routes.js';
import enquiryRoutes from './enquiry.routes.js';
import tradeInAppraisalRoutes from './tradeInAppraisal.routes.js';
import financingRoutes from './financing.routes.js';
import quotationRoutes from './quotation.routes.js';
import salesOrderRoutes from './salesOrder.routes.js';

export function registerRoutes(app: Router): void {
  app.use('/', healthRoutes);

  app.use('/api/auth', authRateLimiter, authRoutes);

  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth')) {
      return next();
    }
    return apiRateLimiter(req, res, next);
  });

  app.use('/api/customers', authenticate, customerRoutes);
  app.use('/api/vehicles', authenticate, vehiclesRoutes);
  app.use('/api/book-test-drive', authenticate, bookTestDriveRoutes);
  app.use('/api/enquiries', authenticate, enquiryRoutes);
  app.use('/api/trade-in-appraisal', authenticate, tradeInAppraisalRoutes);
  app.use('/api/financing', authenticate, financingRoutes);
  app.use('/api/quotations', authenticate, quotationRoutes);
  app.use('/api/sales-orders', authenticate, salesOrderRoutes);
}
