export function toSafeText(value: unknown): string {
  if (value === undefined || value === null) return "";
  const normalized = String(value).trim();
  if (!normalized || normalized === "?") return "";
  return normalized;
}

export function toSearchText(value: unknown): string {
  return toSafeText(value).replace(/\s+/g, " ").toLowerCase();
}
