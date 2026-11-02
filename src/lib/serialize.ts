/**
 * Utility to deeply sanitize Prisma query and action results,
 * converting Decimal objects to standard JavaScript numbers
 * so they can be safely serialized across Next.js Server Components,
 * Client Components, Server Actions, and Cache boundaries.
 */
export function sanitizeData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Prisma Decimal objects
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (
      typeof obj.toNumber === "function" ||
      data.constructor?.name?.startsWith("Decimal") ||
      ("d" in obj && "e" in obj && "s" in obj)
    ) {
      return Number(String(data)) as unknown as T;
    }
  }

  // Preserve Date instances (Next.js RSC supports Date natively)
  if (data instanceof Date) {
    return data;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item)) as unknown as T;
  }

  // Handle Plain Objects
  if (typeof data === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized as T;
  }

  return data;
}
