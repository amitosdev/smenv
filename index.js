const getSecrets = require('./lib/get-secrets')
const {
  readFile,
  backUpFile,
  writeFile,
  removeOldBackups
} = require('./lib/file-handler')
const debug = require('debug')('smenv:index')
const diff = require('./lib/get-diff')
const isEmpty = require('lodash.isempty')
const path = require('path')

module.exports = async ({
  secretName,
  packageName = require(path.join(process.cwd(), 'package.json')).name,
  env = process.env.NODE_ENV || 'development',
  fileName = '.env',
  backupFileRetentionAmount = 3
}) => {
  debug(
    `called with secretName=${secretName}, packageName=${packageName}, env=${env}, fileName=${fileName}, backupFileRetentionAmount=${backupFileRetentionAmount}`
  )

  const calcSecretName = secretName || `${packageName}/${env}`
  debug(`going to pull secret from AWS for ${calcSecretName}`)

  const awsSecrets = await getSecrets(calcSecretName)
  debug(`AWS Secrets: ${JSON.stringify(awsSecrets)}`)

  const currentSecret = await readFile(fileName)
  debug(`current secrets: ${JSON.stringify(currentSecret)}`)

  const filesDiff = diff(currentSecret, awsSecrets)
  debug(`diff:`, filesDiff)
  if (
    isEmpty(filesDiff.added) &&
    isEmpty(filesDiff.deleted) &&
    isEmpty(filesDiff.updated)
  ) {
    debug('no changes detected')
    return { isDiff: false, secretName: calcSecretName, fileName }
  }

  const backupFileName = await backUpFile(fileName)
  debug(`current file backed up: ${backupFileName || 'none'}`)

  await writeFile(fileName, awsSecrets)
  debug(`current file written: ${fileName}`)

  const { deletedFiles } = await removeOldBackups(backupFileRetentionAmount)

  return {
    isDiff: true,
    filesDiff,
    backupFileName,
    secretName: calcSecretName,
    fileName,
    deletedFiles
  }
}
