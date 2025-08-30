import { copyFile, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import debug from 'debug'
import { parse, stringify } from 'envfile'

const debugLogger = debug('smenv:file-handler')

export const getFilePath = (fileName) => {
  return path.join(process.cwd(), fileName)
}

const BASE_FILE_NAME = '.env'

export const getOrCreateCurrentEnvFileName = async (isSupportEnvironment, environment) => {
  const fileName = isSupportEnvironment ? `${BASE_FILE_NAME}.${environment}` : BASE_FILE_NAME
  const filePath = getFilePath(fileName)
  try {
    await stat(filePath)
    debugLogger(`File exists: ${fileName}`)
    return fileName
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  await writeFile(filePath, '', 'utf8')
  debugLogger(`Created empty env file: ${fileName}`)
  return fileName
}

export const readEnvFile = async (currentFileName) => {
  const fileContent = await readFile(getFilePath(currentFileName), 'utf8')
  const parsedContent = parse(fileContent)
  debugLogger(`readEnvFile: file "${currentFileName}" content: `, parsedContent)
  return parsedContent
}

export const writeEnvFile = (fileName, data) => {
  const fileContent = stringify(data)
  debugLogger('writeFile: file content: ', fileContent)
  return writeFile(getFilePath(fileName), fileContent, 'utf8')
}

export const backUpEnvFile = async (currentFileName) => {
  const backupFileName = `${currentFileName}.${Date.now()}.bak`
  debugLogger('backUpFile: backup file: ', backupFileName)
  await copyFile(getFilePath(currentFileName), getFilePath(backupFileName))
  return backupFileName
}
