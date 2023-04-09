const fs = require('fs/promises')
const { parse, stringify } = require('envfile')
const { glob } = require('glob')
const path = require('path')
const debug = require('debug')('smenv:file-handler')

const BACKUP_SUFFIX = '.bak_'

const getFilePath = (module.exports.getFilePath = (fileName) => {
  return path.join(process.cwd(), fileName)
})

module.exports.readFile = async (fileName) => {
  try {
    const fileContent = await fs.readFile(getFilePath(fileName), 'utf8')
    debug('readFile: file content: ', fileContent)
    return parse(fileContent)
  } catch (e) {
    if (!e.message.includes('no such file or directory')) throw e
    debug('readFile: file not found')
    return {}
  }
}

module.exports.writeFile = (fileName, data) => {
  const fileContent = stringify(data)
  debug('writeFile: file content: ', fileContent)
  return fs.writeFile(getFilePath(fileName), fileContent, 'utf8')
}

module.exports.backUpFile = async (fileName) => {
  try {
    await fs.stat(getFilePath(fileName))
  } catch (e) {
    debug('backUpFile: file does not exist: ', fileName)
    return
  }

  const backupFileName = fileName + `${BACKUP_SUFFIX}${Date.now()}`
  debug('backUpFile: backup file: ', backupFileName)
  await fs.copyFile(getFilePath(fileName), getFilePath(backupFileName))
  return backupFileName
}

module.exports.removeOldBackups = async (retentionAmount) => {
  const backupFiles = await glob(getFilePath(`.*.bak_*`))
  debug('removeOldBackups: current backup files: ', backupFiles)
  if (backupFiles.length <= retentionAmount) {
    return
  }
  const sortedByDate = backupFiles.sort((a, b) => {
    return b.split(`${BACKUP_SUFFIX}`)[1] - a.split(`${BACKUP_SUFFIX}`)[1]
  })
  const deleteCandidates = sortedByDate.splice(
    retentionAmount,
    sortedByDate.length - retentionAmount
  )
  debug('removeOldBackups: delete candidates: ', deleteCandidates)
  await Promise.all(
    deleteCandidates.map((backupFile) => {
      return fs.unlink(backupFile)
    })
  )
  return { deletedFiles: deleteCandidates }
}
