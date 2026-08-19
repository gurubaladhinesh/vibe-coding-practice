export type StoredToken = {
  id: string
  value: string
}

export function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

export function base64ToUtf8(encoded: string): string {
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function serializeStoredTokens(tokens: StoredToken[]): string {
  return utf8ToBase64(JSON.stringify(tokens))
}

export function parseStoredTokens(raw: string | null): StoredToken[] {
  if (!raw) return []

  try {
    const json = raw.trimStart().startsWith('[') ? raw : base64ToUtf8(raw)
    const parsed = JSON.parse(json) as StoredToken[]
    return Array.isArray(parsed) ? parsed.filter((item) => item.id && item.value) : []
  } catch {
    return []
  }
}
