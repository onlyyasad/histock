// Redis usage counter TTL (25h to cover timezone drift).
export const AI_USAGE_TTL_SECONDS = 25 * 60 * 60

// Machine-readable code returned when the daily AI limit is hit.
export const AI_LIMIT_REACHED = 'AI_LIMIT_REACHED'

// Supported generation types.
export const AI_GENERATION_TYPES = ['product_description', 'social_post'] as const

// Redis key builders.
export const aiUsageKey = (businessId: string, date: string) => `ai:usage:${businessId}:${date}`
export const aiResultKey = (jobId: string) => `ai:result:${jobId}`
