// biome-ignore-all lint/style/useNamingConvention: mock might be in a different style
import test from 'ava'
import mockFs from 'mock-fs'
import { smenv } from '../index.js'

// Mock secrets data
const mockSecrets = {
  'test-app-synced/local': {
    VAR_ONE: 'one',
    VAR_TWO: 'two',
    VAR_THREE: 'three'
  },
  'test-app/local': {
    VAR_ONE: 'oneandhalf',
    VAR_TWO: 'twoandhalf',
    VAR_FOUR: 'four'
  },
  'test-app/production': {
    VAR_FIVE: 'five'
  },
  'custom-secret': {
    CUSTOM_VAR: 'custom_value'
  }
}
mockFs({
  '.env.local': 'VAR_ONE=one\nVAR_TWO=two\nVAR_THREE=three',
  '.env': 'VAR_FIVE=five'
})

// Mock getAwsSecrets function
const mockGetAwsSecrets = async (secretName) => {
  const secret = mockSecrets[secretName]
  if (secret) {
    return secret
  }
  throw new Error(`Secret ${secretName} not found`)
}

test('returns no diff when secrets are synchronized', async (t) => {
  const result = await smenv({
    packageName: 'test-app-synced',
    environment: 'local',
    isSupportEnvironment: true,
    getAwsSecretsFunc: mockGetAwsSecrets
  })
  t.false(result.isDiff)
  t.deepEqual(result.envs, {
    VAR_ONE: 'one',
    VAR_TWO: 'two',
    VAR_THREE: 'three'
  })
})

test('returns diff when secrets differ from local file', async (t) => {
  const result = await smenv({
    packageName: 'test-app',
    environment: 'local',
    isSupportEnvironment: true,
    getAwsSecretsFunc: mockGetAwsSecrets
  })

  t.true(result.isDiff)
  t.truthy(result.filesDiff)

  t.deepEqual(result.filesDiff.updated, {
    VAR_ONE: 'oneandhalf',
    VAR_TWO: 'twoandhalf'
  })

  t.deepEqual(result.filesDiff.added, {
    VAR_FOUR: 'four'
  })

  t.deepEqual(result.filesDiff.deleted, {
    VAR_THREE: undefined
  })

  t.deepEqual(result.envs, {
    VAR_ONE: 'oneandhalf',
    VAR_TWO: 'twoandhalf',
    VAR_FOUR: 'four'
  })
})

test('uses custom secret name when provided', async (t) => {
  const result = await smenv({
    secretName: 'custom-secret',
    packageName: 'test-app',
    environment: 'local',
    isSupportEnvironment: true,
    getAwsSecretsFunc: mockGetAwsSecrets
  })

  t.true(result.isDiff)
  t.deepEqual(result.envs, {
    CUSTOM_VAR: 'custom_value'
  })
})

test('uses base .env file when environment support disabled', async (t) => {
  const result = await smenv({
    packageName: 'test-app',
    environment: 'production',
    isSupportEnvironment: false,
    getAwsSecretsFunc: mockGetAwsSecrets
  })

  t.false(result.isDiff)
})

test('handles AWS errors gracefully', async (t) => {
  const mockGetAwsSecretsError = async () => {
    throw new Error('AWS Error: Access denied')
  }

  await t.throwsAsync(
    smenv({
      packageName: 'test-app',
      environment: 'local',
      getAwsSecretsFunc: mockGetAwsSecretsError
    }),
    { message: /AWS Error: Access denied/ }
  )
})
