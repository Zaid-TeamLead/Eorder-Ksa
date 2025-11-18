import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import {
  generateOtpController,
  getCurrentUserController,
  signOutController,
  verifyOtpController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";

const router: RouterType = Router();

const generateOtpSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "User ID is required"),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "User ID is required"),
    otp: z.string().min(5, "OTP must be 5 digits").max(5, "OTP must be 5 digits"),
  }),
});

router.post(
  "/generate-otp",
  validate(generateOtpSchema.shape.body, "body"),
  generateOtpController
);

router.post(
  "/verify-otp",
  validate(verifyOtpSchema.shape.body, "body"),
  verifyOtpController
);

router.post("/sign-out", authenticate, signOutController);

router.get("/me", authenticate, getCurrentUserController);

export default router;
