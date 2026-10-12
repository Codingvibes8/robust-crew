import { createHash } from "node:crypto";

/**
 * Privacy-friendly error monitoring and analytics.
 * - No user-identifiable information is logged
 * - Analytics are aggregate-only (counts, no individual tracking)
 * - Error logs include stack traces but strip sensitive headers
 */

export interface ErrorContext {
  path?: string;
  method?: string;
  anonIdHash?: string; // Hashed anonymous ID for debugging without exposing raw ID
}

/**
 * Log an error for monitoring. Strips sensitive information.
 */
export function logError(error: Error, context?: ErrorContext): void {
  const entry = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: context?.path,
    method: context?.method,
    anonIdHash: context?.anonIdHash,
  };

  // In production, this would send to an error monitoring service
  // For now, structured logging to console
  console.error("[ERROR]", JSON.stringify(entry));
}

/**
 * Hash an anonymous ID for safe logging (debugging without exposing raw ID)
 */
export function hashForLogging(value: string): string {
  return createHash("sha256").update(value).digest("hex").substring(0, 12);
}

/**
 * Aggregate analytics event. Only counts and categories, no individual tracking.
 */
export function trackAggregateEvent(
  category: "page_view" | "simplify_request" | "simplify_success" | "simplify_error" | "import_paste" | "import_url" | "import_file",
  metadata?: Record<string, string | number>
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    category,
    ...metadata,
  };

  // In production, this would send to an analytics service
  // For now, structured logging
  console.log("[ANALYTICS]", JSON.stringify(entry));
}
