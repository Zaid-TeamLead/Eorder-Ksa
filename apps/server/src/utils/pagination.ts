export interface Pagination {
  limit?: number;
  offset?: number;
}

export function parsePositiveInteger(
  value: unknown,
  options: { defaultValue?: number; max?: number } = {}
): number | undefined {
  if (value === undefined || value === null || value === '') {
    return options.defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return options.defaultValue;
  }

  const normalized = Math.floor(parsed);
  return options.max ? Math.min(normalized, options.max) : normalized;
}

export function appendLimitOffset(query: string, pagination?: Pagination): string {
  if (!Number.isFinite(pagination?.limit) || Number(pagination?.limit) <= 0) {
    return query;
  }

  const limit = Math.floor(Number(pagination?.limit));
  const offset = Number.isFinite(pagination?.offset) && Number(pagination?.offset) > 0
    ? Math.floor(Number(pagination?.offset))
    : 0;

  return `${query} LIMIT ${limit} OFFSET ${offset}`;
}
