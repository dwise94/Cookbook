/**
 * Instructions are stored as a JSON array of step strings.
 * Legacy: plain text is treated as a single step or split by newlines.
 */
export function parseInstructions(instructions: string | null | undefined): string[] {
  if (instructions == null || instructions === "") return [];
  const trimmed = instructions.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((s): s is string => typeof s === "string").map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      // fall through to legacy
    }
  }
  return trimmed.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

export function serializeInstructions(steps: string[]): string {
  const trimmed = steps.map((s) => String(s).trim()).filter(Boolean);
  return JSON.stringify(trimmed);
}
