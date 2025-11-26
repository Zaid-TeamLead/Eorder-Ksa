import { type Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { apiRateLimiter, authRateLimiter } from '../middleware/rate-limiter.js';

import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import customerRoutes from './customer.routes.js';
import vehiclesRoutes from './vehicles.routes.js';
import bookTestDriveRoutes from './bookTestDrive.routes.js';

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
}
