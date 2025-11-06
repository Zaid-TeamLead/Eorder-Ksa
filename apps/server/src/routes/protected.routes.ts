import { Router, type Router as RouterType } from "express";
import { authenticate } from "../middleware/auth.js";
import { sendSuccess } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { db } from "../services/database.service.js";
import {
  callUserProcedure,
  callSingleResultProcedure,
  callQueryProcedure,
} from "../controllers/procedure.controller.js";
import { z } from "zod";

const router: RouterType = Router();

/**
 * Health check for protected routes
 */
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    return sendSuccess(res, {
      message: "This is a protected route",
      user: req.user,
    });
  })
);

/**
 * Example: Query data from SAP HANA
 * GET /api/protected/data?userId=123
 */
router.get(
  "/data",
  authenticate,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      userId: z.string().optional(),
    });

    const { userId } = schema.parse(req.query);

    if (userId) {
      // Query with parameter
      const results = await db.query(
        "SELECT * FROM YOUR_TABLE WHERE id = ?",
        [userId]
      );
      return sendSuccess(res, results);
    }

    // Query all
    const results = await db.query("SELECT * FROM YOUR_TABLE LIMIT 100");
    return sendSuccess(res, results);
  })
);

/**
 * Example: Call stored procedure with POST body
 * POST /api/protected/procedures/user
 */
router.post("/procedures/user", authenticate, callUserProcedure);

/**
 * Example: Call stored procedure with single result
 * POST /api/protected/procedures/single
 */
router.post("/procedures/single", authenticate, callSingleResultProcedure);

/**
 * Example: Call stored procedure with query parameters
 * GET /api/protected/procedures/search?searchTerm=test&limit=10&offset=0
 */
router.get("/procedures/search", authenticate, callQueryProcedure);

/**
 * Example: Execute INSERT/UPDATE/DELETE
 * POST /api/protected/execute
 */
router.post(
  "/execute",
  authenticate,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      sql: z.string().min(1),
      params: z.array(z.any()).optional(),
    });

    const { sql, params } = schema.parse(req.body);

    // Security: Only allow SELECT queries in this example
    // In production, use parameterized queries and validate SQL
    if (!sql.trim().toUpperCase().startsWith("SELECT")) {
      return res.status(400).json({
        success: false,
        error: { message: "Only SELECT queries are allowed" },
      });
    }

    const results = await db.query(sql, params);
    return sendSuccess(res, results);
  })
);

export default router;
