import { describe, it, expect } from 'vitest'
import { missingSections, SECTIONS } from '@/lib/prompt-lint'

describe('missingSections', () => {
  it('returns nothing for a complete prompt', () => {
    const p = SECTIONS.map(s => `${s}: something`).join('\n')
    expect(missingSections(p)).toEqual([])
  })
  it('lists missing sections', () => {
    const p = SECTIONS.filter(s => s !== 'Where it shows' && s !== 'Done when')
      .map(s => `${s}: x`).join('\n')
    expect(missingSections(p)).toEqual(['Where it shows', 'Done when'])
  })
  it('is case-insensitive', () => {
    const p = SECTIONS.map(s => `${s.toUpperCase()}: x`).join('\n')
    expect(missingSections(p)).toEqual([])
  })
})
