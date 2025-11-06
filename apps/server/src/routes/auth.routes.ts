import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import {
  signInController,
  refreshTokenController,
  signOutController,
  getCurrentUserController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";

const router: RouterType = Router();

// Validation schemas
const signInSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});

// Routes
router.post(
  "/sign-in",
  validate(signInSchema.shape.body, "body"),
  signInController
);

// Refresh token route - no validation needed as token comes from cookies
router.post("/refresh", refreshTokenController);

router.post("/sign-out", authenticate, signOutController);

router.get("/me", authenticate, getCurrentUserController);

export default router;
