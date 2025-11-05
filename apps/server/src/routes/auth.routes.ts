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

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

// Routes
router.post(
  "/sign-in",
  validate(signInSchema.shape.body, "body"),
  signInController
);

router.post(
  "/refresh",
  validate(refreshTokenSchema.shape.body, "body"),
  refreshTokenController
);

router.post("/sign-out", authenticate, signOutController);

router.get("/me", authenticate, getCurrentUserController);

export default router;
