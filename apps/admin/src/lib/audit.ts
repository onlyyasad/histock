// Admin audit log entries store `action` as a single "METHOD /path" string
// (see backend audit.middleware.ts). These helpers split that string and turn
// it into something readable for the audit log UI instead of a raw API route.

const METHOD_VERB: Record<string, string> = {
  POST: 'Created',
  PUT: 'Updated',
  PATCH: 'Updated',
  DELETE: 'Deleted',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Path segments that are record identifiers (UUIDs or numeric ids) are noise,
// not resource names — drop them when building a human-readable label.
function isIdSegment(segment: string): boolean {
  return UUID_RE.test(segment) || /^\d+$/.test(segment)
}

export interface ParsedAuditAction {
  method: string
  path: string
}

export function parseAuditAction(action: string): ParsedAuditAction {
  const trimmed = action.trim()
  const spaceIdx = trimmed.indexOf(' ')
  if (spaceIdx === -1) return { method: '', path: trimmed }
  return {
    method: trimmed.slice(0, spaceIdx).toUpperCase(),
    path: trimmed.slice(spaceIdx + 1),
  }
}

export function humanizeAuditAction(action: string): string {
  const { method, path } = parseAuditAction(action)
  const resource = path
    .split('/')
    .filter(Boolean)
    .filter((seg) => !isIdSegment(seg))
    .map((seg) => seg.replace(/[-_]/g, ' '))
    .join(' ')
    .trim()

  const verb = METHOD_VERB[method]
  if (!verb) return resource ? `Action on ${resource}` : 'Admin action'
  return resource ? `${verb} ${resource}` : verb
}
