import * as core from '@actions/core'
import github from '@actions/github'

import { log } from 'console'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    log('Starting action...')

    const token: string = core.getInput('token')
    const lastFourChars = token.slice(-4)
    core.debug(`Using token: ...${lastFourChars}`)
    log(`Using token: ...${lastFourChars}`)

    const owner: string = core.getInput('owner')
    const repo: string = core.getInput('repo')

    core.debug(`Listing tags for ${owner}/${repo}`)
    log(`Listing tags for ${owner}/${repo}`)

    const octokit = github.getOctokit(token)

    // List all tags
    const tags = await octokit.paginate(octokit.rest.repos.listTags, {
      owner,
      repo,
      per_page: 100
    })

    core.debug(`Found ${tags.length} tags`)
    log(`Found ${tags.length} tags`)
    for (const tag of tags) {
      log(JSON.stringify(tag))
    }

    // Set outputs for other workflow steps to use
    core.setOutput('tag', '0.1.0')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
