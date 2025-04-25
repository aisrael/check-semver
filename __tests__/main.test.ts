/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

import { log } from 'console'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)

const defaultInputs: Record<string, string> = {
  version: '0.1.234',
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
      throw new Error(`Unexpected input: ${key}`)
    }
  })
}

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    // mockCoreInputs({})
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

    await run()

    // Verify that the action was marked as failed.
    expect(core.setFailed).toHaveBeenCalledWith(
      'Bad credentials - https://docs.github.com/rest'
    )
  })
})
