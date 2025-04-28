import semver from 'semver'

const stripPrefix = (name: string, prefix: string | null) =>
  prefix ? name.slice(prefix.length) : name
const stripSuffix = (name: string, suffix: string | null) =>
  suffix ? name.slice(0, -suffix.length) : name

export function stripPrefixSuffix(
  name: string,
  prefix: string | null,
  suffix: string | null
) {
  return stripSuffix(stripPrefix(name, prefix), suffix)
}

export function isValidTagName(
  prefix: string | null,
  suffix: string | null,
  name: string | null
) {
  if (name === null) return false
  if (prefix && !name.startsWith(prefix)) return false
  if (suffix && !name.endsWith(suffix)) return false
  const semverOnly = stripPrefixSuffix(name, prefix, suffix)
  if (semverOnly === '') return false
  return semver.valid(semverOnly) !== null
}

/**
 * Filters a list of tags.
 *
 * @param tags the list of tags to filter
 * @param prefix the prefix to filter by, or null to not filter by prefix
 * @param suffix the suffix to filter by, or null to not filter by suffix
 * @returns a filtered list of tags
 */
export function filterTagNames(
  prefix: string | null,
  suffix: string | null,
  tags: string[]
): string[] {
  return tags.filter((tag) => isValidTagName(prefix, suffix, tag))
}
