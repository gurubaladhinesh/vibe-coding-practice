import { describe, expect, it } from 'vitest'
import { parseStoredTokens, serializeStoredTokens } from './tokenStorage'

describe('token storage encoding', () => {
  it('round-trips tokens through base64', () => {
    const tokens = [{ id: '1', value: 'ghp_example' }]
    const encoded = serializeStoredTokens(tokens)

    expect(encoded).not.toContain('ghp_example')
    expect(parseStoredTokens(encoded)).toEqual(tokens)
  })

  it('still reads legacy plaintext JSON', () => {
    const raw = JSON.stringify([{ id: '1', value: 'ghp_legacy' }])
    expect(parseStoredTokens(raw)).toEqual([{ id: '1', value: 'ghp_legacy' }])
  })
})
