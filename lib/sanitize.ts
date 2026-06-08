// Strip "AI tell" dashes from generated text. Em-dashes become commas; en-dashes
// inside numeric ranges become hyphens; other en-dashes become commas. This is the
// deterministic guarantee that AI-generated reports never ship em-dashes, regardless
// of whether the model follows the prompt instruction.

export function cleanDashes(s: string): string {
  return s
    .replace(/\s*—\s*/g, ', ')            // em-dash → comma
    .replace(/(\d)\s*–\s*(\d)/g, '$1-$2') // numeric en-dash range (e.g. 45–55) → hyphen
    .replace(/\s*–\s*/g, ', ')            // any other en-dash → comma
    .replace(/ {2,}/g, ' ')               // collapse double spaces
    .replace(/\s+,/g, ',')                // remove space before comma
    .replace(/,\s*,/g, ',')               // collapse double commas
}

// Recursively clean every string value in an object/array, returning a new value
// of the same shape. Only string leaves are touched; structure and keys are intact.
export function stripDashesDeep<T>(value: T): T {
  if (typeof value === 'string') return cleanDashes(value) as unknown as T
  if (Array.isArray(value)) return value.map(stripDashesDeep) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = stripDashesDeep(v)
    }
    return out as unknown as T
  }
  return value
}
