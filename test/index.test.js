// biome-ignore-all lint/style/useNamingConvention: mock might be in a different style
import test from 'ava'
import mockFs from 'mock-fs'
import { smenv } from '../index.js'

// Mock secrets data
const mockSecrets = {
  'test-app-local': {
    EXISTING_VAR: 'new_value',
    NEW_VAR: 'new_secret',
    ANOTHER_VAR: 'another_value'
  },
  'test-app-production': {
    PRODUCTION_VAR: 'prod_value',
    ANOTHER_VAR: 'prod_another_value'
  },
  'custom-secret': {
    CUSTOM_VAR: 'custom_value'
  }
}

// Mock getAwsSecrets function
const mockGetAwsSecrets = async (secretName) => {
  const secret = mockSecrets[secretName]
  if (secret) {
    return secret
  }
  throw new Error(`Secret ${secretName} not found`)
}

test.beforeEach(() => {
  mockFs.restore()
  mockFs({
    '/fake/project': {
      'package.json': JSON.stringify({ name: 'test-app' }),
      '.env': 'EXISTING_VAR=old_value\nTO_DELETE=delete_me',
      '.env.local': 'EXISTING_VAR=old_value\nTO_DELETE=delete_me'
    }
  })

  process.chdir('/fake/project')
})

test.afterEach(() => {
  mockFs.restore()
  process.chdir('/Users/amitosdev/Projects/AmitosDev/smenv')
})

test('returns no diff when secrets are synchronized', async (t) => {
  mockFs.restore()
  mockFs({
    '/fake/project': {
      'package.json': JSON.stringify({ name: 'test-app' }),
      '.env.local': 'EXISTING_VAR=new_value\nNEW_VAR=new_secret\nANOTHER_VAR=another_value'
    }
  })
  process.chdir('/fake/project')

  const result = await smenv({
    packageName: 'test-app',
    environment: 'local',
    getAwsSecretsFunc: mockGetAwsSecrets
  })

  t.false(result.isDiff)
  t.deepEqual(result.envs, {
    EXISTING_VAR: 'new_value',
    NEW_VAR: 'new_secret',
    ANOTHER_VAR: 'another_value'
  })
})

test('returns diff when secrets differ from local file', async (t) => {
  const result = await smenv({
    packageName: 'test-app',
    environment: 'local',
    getAwsSecretsFunc: mockGetAwsSecrets
  })

  t.true(result.isDiff)
  t.truthy(result.filesDiff)

  t.deepEqual(result.filesDiff.updated, {
    EXISTING_VAR: 'new_value'
  })

  t.deepEqual(result.filesDiff.added, {
    NEW_VAR: 'new_secret',
    ANOTHER_VAR: 'another_value'
  })

  t.deepEqual(result.filesDiff.deleted, {
    TO_DELETE: undefined
  })

  t.deepEqual(result.envs, {
    EXISTING_VAR: 'new_value',
    NEW_VAR: 'new_secret',
    ANOTHER_VAR: 'another_value'
  })
})

test('uses custom secret name when provided', async (t) => {
  const result = await smenv({
    secretName: 'custom-secret',
    packageName: 'test-app',
    environment: 'local',
    getAwsSecretsFunc: mockGetAwsSecrets
  })

  t.true(result.isDiff)
  t.deepEqual(result.envs, {
    CUSTOM_VAR: 'custom_value'
  })
})

test('creates env file if it does not exist', async (t) => {
  mockFs.restore()
  mockFs({
    '/fake/project': {
      'package.json': JSON.stringify({ name: 'test-app' })
    }
  })
  process.chdir('/fake/project')

  const result = await smenv({
    packageName: 'test-app',
    environment: 'local',
    getAwsSecretsFunc: mockGetAwsSecrets
  })

  t.true(result.isDiff)
  t.deepEqual(result.envs, {
    EXISTING_VAR: 'new_value',
    NEW_VAR: 'new_secret',
    ANOTHER_VAR: 'another_value'
  })
})

test('supports environment-specific files', async (t) => {
  mockFs.restore()
  mockFs({
    '/fake/project': {
      'package.json': JSON.stringify({ name: 'test-app' }),
      '.env.production': 'PROD_VAR=prod_value'
    }
  })
  process.chdir('/fake/project')

  const result = await smenv({
    packageName: 'test-app',
    environment: 'production',
    isSupportEnvironment: true,
    getAwsSecretsFunc: mockGetAwsSecrets
  })

  t.true(result.isDiff)
})

test('uses base .env file when environment support disabled', async (t) => {
  const result = await smenv({
    packageName: 'test-app',
    environment: 'production',
    isSupportEnvironment: false,
    getAwsSecretsFunc: mockGetAwsSecrets
  })

  t.true(result.isDiff)
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
