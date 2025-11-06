import type { Request, Response, NextFunction } from "express";

/**
 * Wraps async route handlers to automatically catch errors
 * This eliminates the need for try-catch blocks in every route handler
 * 
 * @example
 * router.get("/users", asyncHandler(async (req, res) => {
 *   const users = await getUsers();
 *   res.json({ data: users });
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

