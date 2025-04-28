/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import { createHash } from 'crypto'

import * as core from '../__fixtures__/core.js'
import {
  fetchRepoTags,
  fetchRepoReleases
} from '../__fixtures__/octowrapper.js'

import { log } from 'console'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('../src/octowrapper.js', () => ({
  fetchRepoTags,
  fetchRepoReleases
}))

const defaultInputs: Record<string, string> = {
  version: '0.10.1',
  token: process.env.GITHUB_TOKEN || '',
  check_tags: 'true',
  check_releases: 'true',
  repository: 'aisrael/sandbox',
  prefix: '',
  suffix: ''
}

function mockCoreInputs(inputs: Record<string, string>) {
  const mockInputs = { ...defaultInputs, ...inputs }
  log(`mockInputs: ${JSON.stringify(mockInputs)}`)
  core.getInput.mockImplementation((key) => {
    if (Object.prototype.hasOwnProperty.call(mockInputs, key)) {
      return mockInputs[key]
    } else {
      throw new Error(`getInput('${key}') not expected!`)
    }
  })
}

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

/**
 * Generate a fake Git hash (SHA1)
 */
function fakeGitHash(s: string) {
  return createHash('sha1').update(s).digest('hex')
}

/**
 * Just a factory to synthesize tags
 */
function fakeTag(name: string) {
  const sha = fakeGitHash(name)
  return {
    name,
    zipball_url: `https://api.github.com/repos/aisrael/sandbox/zipball/refs/tags/${name}`,
    tarball_url: `https://api.github.com/repos/aisrael/sandbox/tarball/refs/tags/${name}`,
    commit: {
      sha,
      url: `https://api.github.com/repos/aisrael/sandbox/commits/${sha}`
    },
    node_id: 'REF_dQw8RcmV_bRyZWZzL3RhZ3MvY2xpLXYwLjAuOA'
  }
}

/**
 * A factory to synthesize releases
 */
function fakeRelease(name: string) {
  return {
    name
  }
}

describe('main.ts', () => {
  beforeEach(() => {
    fetchRepoTags.mockImplementation(() => {
      // log(`fetchRepoTags(octokit, ${owner}, ${repo})`)
      return Promise.resolve([
        fakeTag('0.10.1'),
        fakeTag('0.9.2'),
        fakeTag('0.1.3'),
        fakeTag('cli-0.1.2')
      ])
    })
    // @ts-ignore
    fetchRepoReleases.mockImplementation(() => {
      return Promise.resolve([fakeRelease('0.10.1')])
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Validates a semver', async () => {
    mockCoreInputs({
      version: '0.1.234',
      check_tags: 'false',
      check_releases: 'false',
      token: '',
      owner: '',
      repo: ''
    })

    await run()

    // Verify the time output was set.
    expect(core.setOutput).toHaveBeenCalled()
    expect(core.setOutput).toHaveBeenCalledWith('valid', 'true')
  })

  it('Catches an invalid semver', async () => {
    mockCoreInputs({
      version: 'a.b.c',
      check_tags: 'false',
      check_releases: 'false',
      token: '',
      owner: '',
      repo: ''
    })

    await run()

    // Verify the time output was set.
    expect(core.setOutput).toHaveBeenCalledWith('valid', 'false')
  })

  it('Sets a failed status if no token is provided and one is needed', async () => {
    // Clear the getInput mock and return an invalid value.
    mockCoreInputs({
      token: ''
    })

    await run()

    // Verify that the action was marked as failed.
    expect(core.setFailed).toHaveBeenCalledWith(
      'token is required when checking tags or releases'
    )
  })

  it('Sets a failed status if an invalid token is provided', async () => {
    // Clear the getInput mock and return an invalid value.
    mockCoreInputs({
      token: 'invalid token'
    })

    fetchRepoTags.mockImplementation(() => {
      throw new Error('Bad credentials - https://docs.github.com/rest')
    })

    await run()

    // Verify that the action was marked as failed.
    expect(core.setFailed).toHaveBeenCalledWith(
      'Bad credentials - https://docs.github.com/rest'
    )
  })

  it("Checks that the version isn't an existing tag", async () => {
    mockCoreInputs({})

    await run()
    expect(fetchRepoTags).toHaveBeenCalled()

    expect(core.setOutput).toHaveBeenCalledWith('valid', 'false')
  })

  it('Checks that the new version is SemVer higher than the latest tag', async () => {
    mockCoreInputs({
      version: '0.10.0'
    })

    await run()
    expect(fetchRepoTags).toHaveBeenCalled()

    expect(core.setOutput).toHaveBeenCalledWith('valid', 'false')
  })

  it('Supports prefixes on tag', async () => {
    mockCoreInputs({
      version: 'cli-0.1.2',
      prefix: 'cli-'
    })

    await run()
    expect(fetchRepoTags).toHaveBeenCalled()

    expect(core.setOutput).toHaveBeenCalledWith('valid', 'false')
  })
})
