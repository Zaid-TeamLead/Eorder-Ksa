import { Router, type Router as RouterType } from "express";
import { authenticate } from "../middleware/auth.js";
import type { Request, Response } from "express";

const router: RouterType = Router();

// Example protected route
router.get("/", authenticate, (req: Request, res: Response) => {
  return res.json({
    data: {
      message: "This is a protected route",
      user: req.user,
    },
  });
});

export default router;
