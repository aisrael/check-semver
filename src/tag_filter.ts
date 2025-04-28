import semver from 'semver'

export function isValidTagName(
  prefix: string | null,
  suffix: string | null,
  name: string | null
) {
  if (name === null) return false
  if (prefix && !name.startsWith(prefix)) return false
  if (suffix && !name.endsWith(suffix)) return false
  const semverOnly = stripPrefix(stripSuffix(name, suffix), prefix)
  if (semverOnly === '') return false
  return semver.valid(semverOnly) !== null
}

const stripPrefix = (name: string, prefix: string | null) =>
  prefix ? name.slice(prefix.length) : name
const stripSuffix = (name: string, suffix: string | null) =>
  suffix ? name.slice(0, -suffix.length) : name

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
