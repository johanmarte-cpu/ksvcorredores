import { z } from "zod";

/**
 * A required string sourced from FormData. Disabled/empty <select> fields are
 * omitted from FormData entirely (submitted as null, not ""), which trips
 * z.string()'s type check with a raw "expected string, received null" error.
 * This preprocesses null/undefined to "" first so validation instead fails
 * with the friendly `message`.
 */
export function requiredString(message: string) {
  return z.preprocess((value) => (value === null || value === undefined ? "" : value), z.string().min(1, message));
}
