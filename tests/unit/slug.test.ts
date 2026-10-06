import { describe, it, expect } from 'vitest'
import { slugify, uniqueSlug } from '@/lib/slug'

describe('slug', () => {
  it('slugifies', () => expect(slugify('Token Weather!')).toBe('token-weather'))
  it('collapses dashes and trims', () => expect(slugify('  --a  -- b--  ')).toBe('a-b'))
  it('caps length at 48', () => expect(slugify('a'.repeat(60)).length).toBe(48))
  it('falls back for empty input', () => expect(slugify('!!!')).toBe('mod'))
  it('makes unique', () => expect(uniqueSlug('a', ['a', 'a-2'])).toBe('a-3'))
  it('keeps free slug', () => expect(uniqueSlug('b', ['a'])).toBe('b'))
})
