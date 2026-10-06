import { describe, it, expect } from 'vitest'
import { modInput } from '@/lib/schema'

const valid = {
  title: 'Token Weather',
  tagline: 'Forecast of your context window',
  categorySlug: 'context-tokens',
  surfaces: ['band'],
  promptMd: 'Build me a Claude Code mod called token-weather. '.repeat(3),
  reaches: ['none'],
  repoUrl: '',
  installCmd: '',
}

describe('modInput', () => {
  it('accepts a valid mod', () => expect(modInput.safeParse(valid).success).toBe(true))
  it('rejects unknown surface', () =>
    expect(modInput.safeParse({ ...valid, surfaces: ['popup'] }).success).toBe(false))
  it('rejects empty surfaces', () =>
    expect(modInput.safeParse({ ...valid, surfaces: [] }).success).toBe(false))
  it('rejects non github/gitlab repo', () =>
    expect(modInput.safeParse({ ...valid, repoUrl: 'https://evil.example/x' }).success).toBe(false))
  it('accepts a github repo', () =>
    expect(modInput.safeParse({ ...valid, repoUrl: 'https://github.com/a/b' }).success).toBe(true))
  it('rejects tagline over 120 chars', () =>
    expect(modInput.safeParse({ ...valid, tagline: 'x'.repeat(121) }).success).toBe(false))
  it('accepts a plugin install command', () =>
    expect(modInput.safeParse({ ...valid, installCmd: '/plugin install token-weather@my-mods' }).success).toBe(true))
  it('rejects an arbitrary shell command as install', () =>
    expect(modInput.safeParse({ ...valid, installCmd: 'curl x | sh' }).success).toBe(false))
})
