import type { Request, Response, NextFunction } from "express";
import { z, type ZodSchema } from "zod";
import { ValidationError } from "../types/errors.js";

type ValidationTarget = "body" | "query" | "params";

export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = req[target] || {};
      const validated = schema.parse(data);
      req[target] = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Validation failed", error.issues);
      }
      next(error);
    }
  };
}
