/**
 * Resource ownership middleware for authorization
 * Provides reusable authorization patterns across all modules
 */

import type { Request, Response, NextFunction } from 'express';
import { AuthorizationError, NotFoundError } from '../types/errors.js';

/**
 * Configuration for resource ownership checking
 */
export interface ResourceOwnershipConfig<T = any> {
  /**
   * Function to fetch the resource by ID
   * @param id Resource identifier
   * @returns Resource object or null if not found
   */
  getResourceById: (id: number | string) => Promise<T | null>;

  /**
   * Function to extract owner identifier from resource
   * @param resource The fetched resource
   * @returns Owner identifier or null/undefined if unassigned
   */
  getOwnerId: (resource: T) => string | undefined | null;

  /**
   * Function to extract current user identifier from request
   * @param req Express request with authenticated user
   * @returns User identifier
   */
  getUserId: (req: Request) => string | string[] | undefined;

  /**
   * Resource name for error messages
   * @example "Enquiry", "Book test drive"
   */
  resourceName: string;

  /**
   * Whether unassigned resources (no owner) can be accessed/modified
   * @default false
   */
  allowUnassigned?: boolean;
}

/**
 * Generic middleware to verify resource ownership
 * - Fetches resource by ID
 * - Checks if user owns the resource
 * - Admin users bypass ownership checks
 * - Attaches resource to req.resource for controller use
 *
 * @param config Configuration object
 * @returns Express middleware function
 *
 * @example
 * router.get('/:id',
 *   asyncHandler(checkResourceOwnership({
 *     getResourceById: EnquiryService.getEnquiryById,
 *     getOwnerId: (enquiry) => enquiry.SLPCODE,
 *     getUserId: (req) => req.user?.SlpCode,
 *     resourceName: 'Enquiry',
 *     allowUnassigned: true
 *   })),
 *   asyncHandler(getEnquiryById)
 * );
 */
export function checkResourceOwnership<T>(config: ResourceOwnershipConfig<T>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const id = req.params.id ?? '';
      const resource = await config.getResourceById(id);

      if (!resource) {
        throw new NotFoundError(`${config.resourceName} not found`);
      }

      // Admin bypass
      if (req.user?.role === 'admin') {
        req.resource = resource; // Attach to request for controller use
        return next();
      }

      const ownerId = config.getOwnerId(resource);
      const userId = config.getUserId(req);

      // Handle unassigned resources
      if (!ownerId) {
        if (config.allowUnassigned) {
          req.resource = resource;
          return next();
        }
        throw new AuthorizationError(
          `This ${config.resourceName.toLowerCase()} is not assigned to any user`
        );
      }

      // Check ownership (convert both to strings for comparison to handle type mismatches)
      const ownerIdStr = String(ownerId).trim();
      const userIdCandidates = Array.isArray(userId) ? userId : [userId];
      const normalizedUserIdCandidates = Array.from(
        new Set(
          userIdCandidates
            .map((value) => (value === undefined || value === null ? '' : String(value).trim()))
            .filter(Boolean)
        )
      );

      // Debug logging
      console.log('Authorization check:', {
        resourceName: config.resourceName,
        ownerId,
        ownerIdType: typeof ownerId,
        ownerIdStr,
        userId,
        userIdType: Array.isArray(userId) ? 'array' : typeof userId,
        userIdCandidates: normalizedUserIdCandidates,
        match: normalizedUserIdCandidates.includes(ownerIdStr),
      });

      if (!normalizedUserIdCandidates.includes(ownerIdStr)) {
        throw new AuthorizationError(
          `You can only access your own ${config.resourceName.toLowerCase()}s. ` +
            `This ${config.resourceName.toLowerCase()} belongs to: ${ownerId} (you are: ${normalizedUserIdCandidates.join(', ') || 'unknown'})`
        );
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Filter-based authorization for list endpoints
 * Ensures non-admin users can only view their own resources
 *
 * @param getUserFilter Function to extract user's filter value
 * @param filterParamName Query parameter name for filtering (default: 'slpCode')
 * @returns Express middleware function
 *
 * @example
 * router.get('/',
 *   enforceOwnershipFilter(
 *     (req) => req.user?.SlpCode,
 *     'slpCode'
 *   ),
 *   asyncHandler(getAllEnquiries)
 * );
 */
export function enforceOwnershipFilter(
  getUserFilter: (req: Request) => string | undefined,
  filterParamName: string = 'slpCode'
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Admin can view all
      if (req.user?.role === 'admin') {
        return next();
      }

      const userFilter = getUserFilter(req);
      const requestedFilter = req.query[filterParamName] as string;

      // If user tries to filter by different owner, block
      if (requestedFilter && userFilter && requestedFilter !== userFilter) {
        throw new AuthorizationError(
          `You can only view your own ${filterParamName === 'slpCode' ? 'items' : filterParamName}`
        );
      }

      // Enforce user filter for non-admin
      if (!requestedFilter && userFilter) {
        req.query[filterParamName] = userFilter;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Extend Express Request type to include resource
declare global {
  namespace Express {
    interface Request {
      resource?: any;
    }
  }
}
