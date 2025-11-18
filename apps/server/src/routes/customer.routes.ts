import { Router, type Router as RouterType } from "express";
import { sendSuccess } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { validate } from "@/middleware/validator.js";
import { z } from "zod";
import { searchCustomers } from "@/services/customer.service.js";

const router: RouterType = Router();

router.post(
  "/search",
  validate(z.object({
    search: z.string().min(1, "Search is required"),
    slpCode: z.string().min(1, "SLP Code is required"),
  }), "body"),
  asyncHandler(async (req, res) => {
    const { search, slpCode } = req.body;
    const customers = await searchCustomers(search, slpCode);
    return sendSuccess(res, customers);
  })
);

export default router;
