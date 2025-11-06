import type { Request, Response } from "express";
import { db } from "../services/database.service.js";
import { logger } from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { z } from "zod";

/**
 * Example: Call a stored procedure with parameters
 * 
 * SAP HANA Procedure Example:
 * CREATE PROCEDURE SCHEMA.GET_USER_DATA(
 *   IN user_id NVARCHAR(50),
 *   OUT result_count INTEGER
 * )
 * AS BEGIN
 *   SELECT * FROM USERS WHERE ID = :user_id;
 *   SELECT COUNT(*) INTO result_count FROM USERS WHERE ID = :user_id;
 * END;
 */
export const callUserProcedure = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      userId: z.string().min(1, "User ID is required"),
    });

    const { userId } = schema.parse(req.body);

    try {
      // Call stored procedure
      // Format: "SCHEMA.PROCEDURE_NAME" or just "PROCEDURE_NAME" if using current schema
      const results = await db.callProcedure<{
        id: string;
        name: string;
        email: string;
      }>("BI_NEGT_KSA.GET_USER_DATA", [userId]);

      return sendSuccess(res, results);
    } catch (error: any) {
      logger.error({ error, userId }, "Failed to call user procedure");
      return sendError(
        res,
        error.message || "Failed to execute stored procedure",
        500,
        "PROCEDURE_ERROR"
      );
    }
  }
);

/**
 * Example: Call a stored procedure that returns a single result
 */
export const callSingleResultProcedure = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      param1: z.string(),
      param2: z.number().optional(),
    });

    const { param1, param2 } = schema.parse(req.body);

    try {
      const result = await db.callProcedureOne<{
        result: string;
        status: number;
      }>("BI_NEGT_KSA.GET_SINGLE_RESULT", [param1, param2]);

      if (!result) {
        return sendError(res, "No result found", 404, "NOT_FOUND");
      }

      return sendSuccess(res, result);
    } catch (error: any) {
      logger.error({ error, param1, param2 }, "Failed to call procedure");
      return sendError(
        res,
        error.message || "Failed to execute stored procedure",
        500,
        "PROCEDURE_ERROR"
      );
    }
  }
);

/**
 * Example: Call a stored procedure with query results
 */
export const callQueryProcedure = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      searchTerm: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    });

    const { searchTerm, limit, offset } = schema.parse({
      ...req.query,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    });

    try {
      const results = await db.callProcedure<{
        id: string;
        name: string;
        created_at: Date;
      }>("BI_NEGT_KSA.SEARCH_USERS", [searchTerm || "", limit, offset]);

      return sendSuccess(res, results, 200, {
        page: offset !== undefined && limit ? Math.floor(offset / limit) + 1 : 1,
        limit,
        total: results.length,
      });
    } catch (error: any) {
      logger.error({ error, searchTerm }, "Failed to call search procedure");
      return sendError(
        res,
        error.message || "Failed to execute search procedure",
        500,
        "PROCEDURE_ERROR"
      );
    }
  }
);

