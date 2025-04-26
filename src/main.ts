import * as core from '@actions/core'
import github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'

import { log } from 'console'
import { getInputs, Input } from './inputs.js'
import * as semver from 'semver'
import { fetchRepoTags, fetchRepoReleases } from './octowrapper.js'

type GitHubType = InstanceType<typeof GitHub>

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    log('Starting action...')

    const inputs = getInputs()
    log(`inputs: ${JSON.stringify(inputs)}`)

    const version = inputs.version
    log(`Validating version '${version}'`)
    const isValidSemVer = semver.valid(version) !== null

    if (inputs.checkTags || inputs.checkReleases) {
      const lastFourChars = inputs.token.slice(-4)
      core.debug(`Using token: ...${lastFourChars}`)
      log(`Using token: ...${lastFourChars}`)
    }

    const octokit =
      inputs.checkTags || inputs.checkReleases
        ? github.getOctokit(inputs.token)
        : null

    const tagsOk = inputs.checkTags ? await checkTags(inputs, octokit) : true
    log(`tagsOk: ${tagsOk.toString()}`)

    const releaseOk = inputs.checkReleases
      ? await checkReleases(inputs, octokit)
      : true
    log(`releaseOk: ${releaseOk.toString()}`)

    const valid = isValidSemVer && tagsOk && releaseOk
    log(`Valid: ${valid.toString()}`)

    // Set outputs for other workflow steps to use
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

  core.debug(`Listing tags for ${owner}/${repo}`)
  log(`Listing tags for ${owner}/${repo}`)

  // List all tags
  const allTags = await fetchRepoTags(octokit, owner, repo)
  core.debug(`Found ${allTags.length} total tags`)
  log(`Found ${allTags.length} total tags`)

  const tags = allTags.filter((tag) => {
    const name = tag.name
    return (
      (inputs.prefix ? name.startsWith(inputs.prefix) : true) &&
      (inputs.suffix ? name.endsWith(inputs.suffix) : true)
    )
  })
  core.debug(`Found ${tags.length} tags matching prefix/suffix`)
  log(`Found ${tags.length} tags matching prefix/suffix`)

  for (const tag of tags) {
    log(JSON.stringify(tag))
  }

  if (tags.find((tag) => tag.name === inputs.version)) {
    log(`Found tag matching version: ${inputs.version}`)
    return false
  }

  const highestTag = semver.maxSatisfying(
    tags.map((tag) =>
      stripSuffix(stripPrefix(tag.name, inputs.prefix), inputs.suffix)
    ),
    '*'
  )
  log(`highestTag: ${highestTag}`)
  if (highestTag) {
    const greater = semver.gt(inputs.version, highestTag)
    log(`semver.gt(${inputs.version}, ${highestTag}): ${greater}`)
    return greater
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

  core.debug(`Listing releases for ${owner}/${repo}`)
  log(`Listing releases for ${owner}/${repo}`)

  const releases = await fetchRepoReleases(octokit, owner, repo)

  core.debug(`Found ${releases.length} releases`)
  log(`Found ${releases.length} releases`)
  for (const release of releases) {
    log(JSON.stringify(release))
  }

  if (releases.find((release) => release.name === inputs.version)) {
    return false
  }

  const releaseNames = releases
    .filter((release) => release.name)
    .map((release) =>
      stripSuffix(
        stripPrefix(release.name as string, inputs.prefix),
        inputs.suffix
      )
    )

  const highestRelease = semver.maxSatisfying(releaseNames, '*')
  log(`highestRelease: ${highestRelease}`)
  if (highestRelease) {
    const greater = semver.gt(inputs.version, highestRelease)
    log(`semver.gt(${inputs.version}, ${highestRelease}): ${greater}`)
    return greater
  }

  return true
}

function stripPrefix(name: string, prefix: string | null) {
  return prefix ? name.slice(prefix.length) : name
}

function stripSuffix(name: string, suffix: string | null) {
  return suffix ? name.slice(0, -suffix.length) : name
}
