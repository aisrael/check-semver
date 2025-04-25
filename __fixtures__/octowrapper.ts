import { jest } from '@jest/globals'

export const fetchRepoTags =
  jest.fn<typeof import('../src/octowrapper.ts').fetchRepoTags>()
