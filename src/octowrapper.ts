import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types'
import { Octokit } from '@octokit/rest'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const octokit = new Octokit()
type ListTagsResponseDataType = GetResponseDataTypeFromEndpointMethod<
  typeof octokit.repos.listTags
>
type ListReleasesResponseDataType = GetResponseDataTypeFromEndpointMethod<
  typeof octokit.repos.listReleases
>

type GitHubType = InstanceType<typeof GitHub>

/**
 * Wrapper around octokit.rest.repos.listTags.
 * We wrap the actual call(s) to octokit just so it's easier to mock in tests, rather than having to mock the entire octokit instance.
 * @param octokit the octokit instance to use
 * @param owner the owner of the repository
 * @param repo the repository name
 */
export async function fetchRepoTags(
  octokit: GitHubType,
  owner: string,
  repo: string
): Promise<ListTagsResponseDataType> {
  core.debug(`fetchRepoTags(${owner}, ${repo})`)
  return await octokit.paginate(octokit.rest.repos.listTags, {
    owner,
    repo,
    per_page: 100
  })
}

/**
 * Wrapper around octokit.rest.repos.listReleases.
 * We wrap the actual call(s) to octokit just so it's easier to mock in tests, rather than having to mock the entire octokit instance.
 @param octokit the octokit instance to use
 @param owner the owner of the repository
 @param repo the repository name
 */
export async function fetchRepoReleases(
  octokit: GitHubType,
  owner: string,
  repo: string
): Promise<ListReleasesResponseDataType> {
  core.debug(`fetchRepoReleases(${owner}, ${repo})`)
  return await octokit.paginate(octokit.rest.repos.listReleases, {
    owner,
    repo,
    per_page: 100
  })
}
