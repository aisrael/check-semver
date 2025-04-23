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
  token: process.env.GITHUB_TOKEN || '',
  owner: 'aisrael',
  repo: 'sandbox'
}

const actionsStepDebug = process.env.ACTIONS_STEP_DEBUG
log(`ACTIONS_STEP_DEBUG: ${actionsStepDebug}`)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    // Set the action's inputs as return values from core.getInput().
    core.getInput.mockImplementation((input) => {
      if (defaultInputs[input]) {
        return defaultInputs[input]
      } else {
        throw new Error(`Unexpected input: ${input}`)
      }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Sets the tag output', async () => {
    await run()

    // Verify the time output was set.
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'tag',
      // Simple regex to match a SemVer tag
      expect.stringMatching(/^\d+.\d+.\d+/)
    )
  })

  it('Sets a failed status', async () => {
    // Clear the getInput mock and return an invalid value.
    defaultInputs.token = 'invalid token'

    await run()

    // Verify that the action was marked as failed.
    expect(core.setFailed).toHaveBeenNthCalledWith(
      1,
      'Bad credentials - https://docs.github.com/rest'
    )
  })
})
