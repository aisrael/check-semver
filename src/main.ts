import * as core from '@actions/core'
import github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'

import { getInputs, Input } from './inputs.js'
import * as semver from 'semver'
import { fetchRepoTags, fetchRepoReleases } from './octowrapper.js'
import { isValidTagName, stripPrefixSuffix } from './tag_filter.js'

type GitHubType = InstanceType<typeof GitHub>

/**
 * We wrap core.debug so we can add a console.log during local development and testing
 *
 * @param message The message to log
 */
function debug(message: string) {
  core.debug(message)
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const inputs = getInputs()
    debug(`inputs: ${JSON.stringify(inputs)}`)

    const version = inputs.version
    core.info(`Validating version '${version}'`)

    const isValidSemVer = isValidTagName(inputs.prefix, inputs.suffix, version)
    if (!isValidSemVer) {
      core.setOutput('valid', 'false')
      if (inputs.prefix && !version.startsWith(inputs.prefix)) {
        const message = `'${version}' does not start with prefix '${inputs.prefix}'`
        core.setOutput('message', message)
        core.notice(message)
      } else if (inputs.suffix && !version.endsWith(inputs.suffix)) {
        const message = `'${version}' does not end with suffix '${inputs.suffix}'`
        core.setOutput('message', message)
        core.notice(message)
      } else {
        const message = `'${version}' is not a valid SemVer`
        core.setOutput('message', message)
        core.notice(message)
      }
      return
    }

    if (inputs.checkTags || inputs.checkReleases) {
      const lastFourChars = inputs.token.slice(-4)
      debug(`Using token: ...${lastFourChars}`)
    }

    const octokit =
      inputs.checkTags || inputs.checkReleases
        ? github.getOctokit(inputs.token)
        : null

    const tagsOk = inputs.checkTags ? await checkTags(inputs, octokit) : true
    debug(`tagsOk: ${tagsOk.toString()}`)

    const releaseOk = tagsOk
      ? inputs.checkReleases
        ? await checkReleases(inputs, octokit)
        : true
      : false
    debug(`releaseOk: ${releaseOk.toString()}`)

    const valid = isValidSemVer && tagsOk && releaseOk
    debug(`Valid: ${valid.toString()}`)

    // Set outputs for other workflow steps to use
    if (valid) {
      core.setOutput('message', 'Version is valid')
      core.info('Version is valid')
    }
    core.setOutput('valid', valid.toString())
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
      // Fail the workflow run if an error occurs
      core.setFailed(error.message)
    }
  }
}

async function checkTags(
  inputs: Input,
  octokit: GitHubType | null
): Promise<boolean> {
  if (!octokit) {
    return false
  }

  const owner = inputs.owner
  const repo = inputs.repo

  debug(`Listing tags for ${owner}/${repo}`)

  // List all tags
  const allTags = await fetchRepoTags(octokit, owner, repo)
  debug(`Found ${allTags.length} total tags`)

  const tags = allTags.filter((tag) =>
    isValidTagName(inputs.prefix, inputs.suffix, tag.name)
  )
  debug(`Found ${tags.length} tags matching prefix/suffix`)

  for (const tag of tags) {
    debug(tag.name)
  }

  if (tags.find((tag) => tag.name === inputs.version)) {
    debug(`Found tag matching version: ${inputs.version}`)
    const message = `Tag '${inputs.version}' already exists`
    core.setOutput('message', message)
    core.notice(message)
    return false
  }

  const semverOnly = stripPrefixSuffix(
    inputs.version,
    inputs.prefix,
    inputs.suffix
  )
  const highestTag = semver.maxSatisfying(
    tags.map((tag) =>
      stripPrefixSuffix(tag.name, inputs.prefix, inputs.suffix)
    ),
    '*'
  )
  debug(`highestTag: ${highestTag}`)
  if (highestTag) {
    const greater = semver.gt(semverOnly, highestTag)
    debug(`semver.gt(${semverOnly}, ${highestTag}): ${greater}`)
    if (!greater) {
      const message = `'${inputs.version}' is not SemVer higher than existing tag '${highestTag}'`
      core.setOutput('message', message)
      core.notice(message)
      return false
    }
  }

  return true
}

async function checkReleases(
  inputs: Input,
  octokit: GitHubType | null
): Promise<boolean> {
  if (!octokit) {
    return false
  }

  const owner = inputs.owner
  const repo = inputs.repo

  debug(`Listing releases for ${owner}/${repo}`)

  const allReleases = await fetchRepoReleases(octokit, owner, repo)
  const releases = allReleases.filter((release) =>
    isValidTagName(inputs.prefix, inputs.suffix, release.name)
  )

  debug(`Found ${releases.length} releases matching prefix/suffix`)
  for (const release of releases) {
    debug(release.name || '(null)')
  }

  if (releases.find((release) => release.name === inputs.version)) {
    debug(`Found release matching version: ${inputs.version}`)
    const message = `Release '${inputs.version}' already exists`
    core.setOutput('message', message)
    core.notice(message)
    return false
  }

  const releaseVersions = releases
    .filter((release) => release.name)
    .map((release) =>
      stripPrefixSuffix(release.name as string, inputs.prefix, inputs.suffix)
    )

  const semverOnly = stripPrefixSuffix(
    inputs.version,
    inputs.prefix,
    inputs.suffix
  )
  const highestRelease = semver.maxSatisfying(releaseVersions, '*')
  debug(`highestRelease: ${highestRelease}`)
  if (highestRelease) {
    const greater = semver.gt(semverOnly, highestRelease)
    debug(`semver.gt(${semverOnly}, ${highestRelease}): ${greater}`)
    if (!greater) {
      const message = `Release '${inputs.version}' is not SemVer higher than existing release '${highestRelease}'`
      core.setOutput('message', message)
      core.notice(message)
      return false
    }
  }

  return true
}
