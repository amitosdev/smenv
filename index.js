import debug from 'debug'
import isEmpty from 'lodash.isempty'
import { backUpEnvFile, readEnvFile, resolveCurrentEnvFile, writeEnvFile } from './lib/env-file-handler.js'
import { getAwsSecrets } from './lib/get-aws-secrets.js'
import { getDiff } from './lib/get-diff.js'
import { getPackageName } from './lib/get-package-name.js'
import { getSecretName } from './lib/get-secret-name.js'

const debugLogger = debug('smenv:index')

export async function smenv({
  secretName,
  packageName,
  environment = process.env.NODE_ENV || 'local',
  isSupportEnvironment = false,
  isBackupCurrentFile = false,
  awsSettings = {},
  getAwsSecretsFunc = getAwsSecrets
}) {
  const currentFileName = await resolveCurrentEnvFile(isSupportEnvironment, environment)
  debugLogger(`current env file name: ${currentFileName}`)

  if (isBackupCurrentFile) {
    const backupFileName = await backUpEnvFile(currentFileName)
    debugLogger(`current file backed up: ${backupFileName}`)
  }

  const calcPackageName = packageName || (await getPackageName())
  const calcSecretName = getSecretName(secretName, calcPackageName, environment)
  debugLogger(`going to pull secret from AWS for ${calcSecretName}`)
  const awsSecrets = await getAwsSecretsFunc(calcSecretName, awsSettings)
  debugLogger(`AWS Secrets: ${JSON.stringify(awsSecrets)}`)

  const currentEnvContent = await readEnvFile(currentFileName)
  debugLogger(`current env content: ${JSON.stringify(currentEnvContent)}`)

  const filesDiff = getDiff(currentEnvContent, awsSecrets)
  debugLogger('diff from AWS secret: ', JSON.stringify(filesDiff))

  if (isEmpty(filesDiff.added) && isEmpty(filesDiff.deleted) && isEmpty(filesDiff.updated)) {
    debugLogger('no changes detected')
    return { isDiff: false, envs: currentEnvContent }
  }

  await writeEnvFile(currentFileName, awsSecrets)
  debugLogger(`current file written: ${currentFileName}`)

  return { isDiff: true, filesDiff, envs: awsSecrets }
}
