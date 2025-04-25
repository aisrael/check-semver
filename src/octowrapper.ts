import { GitHub } from '@actions/github/lib/utils'
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types'
import { Octokit } from '@octokit/rest'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const octokit = new Octokit()
type ListTagsResponseDataType = GetResponseDataTypeFromEndpointMethod<
  typeof octokit.repos.listTags
>

import { log } from 'console'

type GitHubType = InstanceType<typeof GitHub>

/**
 * We wrap the actual call(s) to octokit just so its easier to mock in tests, rather than having to mock the entire octokit instance.
 * @param octokit the octokit instance to use
 * @param owner the owner of the repository
 * @param repo the repository name
 */
export async function fetchRepoTags(
  octokit: GitHubType,
  owner: string,
  repo: string
): Promise<ListTagsResponseDataType> {
  log(`Fetching tags for ${owner}/${repo}`)
  return await octokit.paginate(octokit.rest.repos.listTags, {
    owner,
    repo,
    per_page: 100
  })
}
