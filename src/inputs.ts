import * as core from '@actions/core'
import github from '@actions/github'

export interface Input {
  /**
   * The version or tag to validate
   */
  version: string

  /**
   * The GitHub token to use to access the GitHub API
   */
  token: string

  /**
   * The account or owner of the repository
   */
  owner: string

  /**
   * The repository name only
   */
  repo: string

  /**
   * Whether to check the repository's tags
   */
  checkTags: boolean

  /**
   * Whether to check the repository's releases
   */
  checkReleases: boolean

  /**
   * An optional prefix to prepend to the SemVer
   */
  prefix: string

  /**
   * An optional suffix to append to the SemVer
   */
  suffix: string
}

export function getInputs(): Input {
  const version = core.getInput('version', { required: true })

  const checkTags = core.getBooleanInput('check_tags')
  const checkReleases = core.getBooleanInput('check_releases')
  const token = core.getInput('token')
  if (checkTags || checkReleases) {
    if (!token) {
      throw new Error('token is required when checking tags or releases')
    }
  }

  const repository = core.getInput('repository')
  // If repository is given, check that it's of the form 'owner/repo'
  if (repository && !repository.match(/^\w+\/\w+$/)) {
    throw new Error('repository must be in the form owner/repo')
  }
  // If no repository explicitly given, just use the github.context.repo.owner and .repo
  const [owner, repo] = repository
    ? repository.split('/')
    : [github.context.repo.owner, github.context.repo.repo]

  return {
    version,
    token,
    owner,
    repo,
    checkTags,
    checkReleases,
    prefix: core.getInput('prefix'),
    suffix: core.getInput('suffix')
  }
}
