import { Router, type Router as RouterType } from "express";
import { healthCheckController } from "../controllers/health.controller.js";

const router: RouterType = Router();

router.get("/health", healthCheckController);

export default router;
