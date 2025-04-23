import semver from 'semver'

import { log } from 'console'

/**
 * Filters a list of tags.
 *
 * @param tags the list of tags to filter
 * @returns a filtered list of tags
 */
export function filterTagNames(tags: string[]): string[] {
  return tags.filter((tag) => {
    log(`Filtering tag: ${tag}`)
    const valid = semver.valid(tag)
    log(`semver.valid(${tag}): ${valid}`)
    return valid
  })
}
