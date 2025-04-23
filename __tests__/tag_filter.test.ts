/**
 * Unit tests for src/tag_filter.ts
 */
import { filterTagNames } from '../src/tag_filter.js'

import { log } from 'console'

describe('filterTagNames', () => {
  it('returns only valid semver tags', async () => {
    const tagNames: string[] = ['0.1.0', 'beta', '0.1.1', 'a.b.c']

    const result = filterTagNames(tagNames)
    log(result)

    expect(result).toEqual(['0.1.0', '0.1.1'])
  })
})
