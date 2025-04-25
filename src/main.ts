import * as core from '@actions/core'
import github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'

import { log } from 'console'
import { getInputs, Input } from './inputs.js'
import * as semver from 'semver'
import { fetchRepoTags } from './octowrapper.js'

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
    const releaseOk = inputs.checkReleases
      ? await checkReleases(inputs, octokit)
      : true

    const valid = isValidSemVer && tagsOk && releaseOk
    log(`Valid: ${valid.toString()}`)

    // Set outputs for other workflow steps to use
    core.setOutput('valid', valid.toString())
  } catch (error) {
    if (error instanceof Error) {
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
  const tags = await fetchRepoTags(octokit, owner, repo)

  core.debug(`Found ${tags.length} tags`)
  log(`Found ${tags.length} tags`)
  for (const tag of tags) {
    log(JSON.stringify(tag))
  }

  if (tags.find((tag) => tag.name === inputs.version)) {
    return false
  }

  // TODO: Check for highest semver tag

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

  const releases = await octokit.paginate(octokit.rest.repos.listReleases, {
    owner,
    repo,
    per_page: 100
  })
  core.debug(`Found ${releases.length} releases`)
  log(`Found ${releases.length} releases`)

  for (const release of releases) {
    log(JSON.stringify(release))
  }

  console.error('checkReleases() not yet implemented!')
  return true
}
