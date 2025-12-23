import { logger } from './logger.js';
import { getCurrentTimestamp } from './date-helpers.js';

/**
 * Configuration for field mapping between API/schema names and database column names
 */
export interface FieldMapping {
  // Key is the API/schema field name, value is the database column name
  [key: string]: string;
}

/**
 * Configuration for custom value transformers
 */
export interface ValueTransformer {
  // Function that transforms a value before inserting into DB
  [key: string]: (value: any) => any;
}

/**
 * Result of building dynamic update query
 */
export interface UpdateQueryResult {
  updates: string[];
  parameters: any[];
}

/**
 * Generic utility to build dynamic UPDATE SQL queries
 * Eliminates repetitive if (data.field !== undefined) patterns
 *
 * @param data - The update data object
 * @param fieldMapping - Map of API field names to database column names
 * @param valueTransformers - Optional custom transformers for specific fields
 * @returns Object containing SQL fragments and parameters array
 *
 * @example
 * const { updates, parameters } = buildUpdateQuery(
 *   { customerName: 'John', email: 'john@example.com' },
 *   { customerName: 'CUSTOMERNAME', email: 'EMAIL' }
 * );
 * // Result: updates = ['"CUSTOMERNAME" = ?', '"EMAIL" = ?']
 * //         parameters = ['John', 'john@example.com']
 */
export function buildUpdateQuery(
  data: Record<string, any>,
  fieldMapping: FieldMapping,
  valueTransformers?: ValueTransformer
): UpdateQueryResult {
  const updates: string[] = [];
  const parameters: any[] = [];

  for (const [apiField, dbColumn] of Object.entries(fieldMapping)) {
    // Only process fields that are present in the update data
    if (data[apiField] !== undefined) {
      let value = data[apiField];

      // Apply custom transformer if provided
      if (valueTransformers && valueTransformers[apiField]) {
        value = valueTransformers[apiField](value);
      } else {
        // Default behavior: convert empty strings and undefined to null
        value = value === '' || value === undefined ? null : value;
      }

      updates.push(`"${dbColumn}" = ?`);
      parameters.push(value);
    }
  }

  return { updates, parameters };
}

/**
 * Add audit fields (updatedDate, updatedBy) to update query
 */
export function addAuditFields(
  updates: string[],
  parameters: any[],
  updatedBy: string
): void {
  const currentDateTime = getCurrentTimestamp();
  updates.push('"UPDATEDDATE" = ?');
  parameters.push(currentDateTime);
  updates.push('"UPDATEDBY" = ?');
  parameters.push(updatedBy.substring(0, 8)); // Truncate to 8 chars (DB constraint)
}

/**
 * Helper to execute update with empty check
 */
export function validateUpdateQuery(updates: string[]): boolean {
  if (updates.length === 0) {
    logger.info('No fields to update');
    return false;
  }
  return true;
}
