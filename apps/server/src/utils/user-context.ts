/**
 * User context utilities for standardized user information extraction
 * Centralizes user info handling across all modules
 */

import type { Request } from 'express';

/**
 * User context interface
 */
export interface UserContext {
  name: string;
  slpCode?: string;
  role?: string;
}


export function getUserContext(req: Request): UserContext {
  return {
    name: req.user?.name || 'System',
    slpCode: req.user?.SlpCode,
    role: req.user?.role,
  };
}

/**
 * Get audit user value for CREATEDBY/UPDATEDBY fields
 * Priority: user name > 'System'
 * Used by Enquiry module
 *
 * @param req Express request with authenticated user
 * @returns User name or 'System' as fallback
 *
 * @example
 * const createdBy = getAuditUser(req); // "John Doe" or "System"
 */
export function getAuditUser(req: Request): string {
  return req.user?.name || 'System';
}

/**
 * Get audit user value with SlpCode priority
 * Priority: SlpCode > name > 'SYSTEM'
 * Used by Book Test Drive module for compatibility with existing data
 *
 * @param req Express request with authenticated user
 * @returns SlpCode, user name, or 'SYSTEM' as fallback
 *
 * @example
 * const createdBy = getAuditUserWithSlpCode(req); // "12345" or "John Doe" or "SYSTEM"
 */
export function getAuditUserWithSlpCode(req: Request): string {
  return (req.user?.SlpCode || req.user?.name || 'SYSTEM').toString();
}
