// Frontend-only placeholder API functions.
// These names are intentionally "backend-shaped" so you can wire real HTTP later.

export async function delay(ms = 250) {
  await new Promise((r) => setTimeout(r, ms));
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}


