/**
 * Unit tests for src/tag_filter.ts
 */
import { isValidTagName, filterTagNames } from '../src/tag_filter.js'

import { log } from 'console'

describe('isValidTagName', () => {
  it('returns true for valid semver tags', async () => {
    expect(isValidTagName(null, null, '0.1.0')).toBe(true)
    expect(isValidTagName(null, null, 'v0.1.1')).toBe(true)
    expect(isValidTagName(null, null, '0.1.1-beta')).toBe(true)
    expect(isValidTagName(null, null, 'a.b.c')).toBe(false)
  })
  it('returns true for valid semver tags with prefix', async () => {
    expect(isValidTagName('cli-', null, 'cli-0.1.0')).toBe(true)
    expect(isValidTagName('cli-', null, 'cli-v0.1.1')).toBe(true)
    expect(isValidTagName('cli-', null, 'cli-0.1.1-beta')).toBe(true)
    expect(isValidTagName('cli-', null, 'cli-a.b.c')).toBe(false)
  })
  it('returns true for valid semver tags with suffix', async () => {
    expect(isValidTagName(null, '-hotfix', '0.1.0-hotfix')).toBe(true)
    expect(isValidTagName(null, '-hotfix', 'v0.1.0-hotfix')).toBe(true)
    expect(isValidTagName(null, '-hotfix', 'a.b.c-hotfix')).toBe(false)
  })
})

describe('filterTagNames', () => {
  it('returns only valid semver tags', async () => {
    const tagNames: string[] = ['0.1.0', 'beta', '0.1.1', 'a.b.c']

    const result = filterTagNames(null, null, tagNames)
    log(result)

    expect(result).toEqual(['0.1.0', '0.1.1'])
  })

  it('returns only valid semver tags with prefix', async () => {
    const tagNames: string[] = ['cli-0.1.0', 'v0.1.1', 'cli-0.1.1', 'cli-a.b.c']

    const result = filterTagNames('cli-', null, tagNames)
    log(result)

    expect(result).toEqual(['cli-0.1.0', 'cli-0.1.1'])
  })

  it('returns only valid semver tags with suffix', async () => {
    const tagNames: string[] = [
      '0.1.0-beta',
      'v0.1.1',
      '0.1.1-beta',
      'a.b.c-beta'
    ]

    const result = filterTagNames(null, '-beta', tagNames)
    log(result)

    expect(result).toEqual(['0.1.0-beta', '0.1.1-beta'])
  })
})
