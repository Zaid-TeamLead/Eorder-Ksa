import type { Request, Response, NextFunction } from 'express';
import { z, type ZodSchema } from 'zod';
import { ValidationError } from '../types/errors.js';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = req[target] || {};
      const validated = schema.parse(data);

      // Only reassign body, as query and params are read-only in Express
      // For query and params, validation ensures they're valid but we don't reassign
      if (target === 'body') {
        req.body = validated;
      }
      // For query/params, validation passes and req.query/req.params remain accessible

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Validation failed', error.issues);
      }
      next(error);
    }
  };
}
