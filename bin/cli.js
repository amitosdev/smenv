#!/usr/bin/env node
const yargs = require('yargs')
const smenv = require('../index')
const isEmpty = require('lodash.isempty')
const log = require('./log')
async function main() {
  const { argv } = yargs
    .usage('Usage: $0 [options]')
    .options({
      secretName: {
        alias: 's',
        describe: 'The name of the secret to fetch from AWS Secrets Manager',
        type: 'string'
      },
      packageName: {
        alias: 'p',
        describe: 'The name of the package',
        defaultDescription: 'value from package.json in current directory',
        type: 'string'
      },
      env: {
        alias: 'e',
        describe: 'The environment name',
        defaultDescription: "NODE_ENV environment variable or 'development'",
        type: 'string'
      },
      fileName: {
        alias: 'f',
        describe: 'The name of the file to write secrets to',
        defaultDescription: '.env',
        type: 'string'
      },
      backupRetention: {
        alias: 'r',
        describe: 'The number of backup files to retain',
        defaultDescription: 3,
        type: 'number'
      }
    })
    .example(
      '$0 --secretName mySecret',
      'Fetches the specified secret from AWS Secrets Manager'
    )
    .example(
      '$0 --packageName myApp --env production',
      'Specifies custom package name and environment'
    )
    .example(
      '$0 -s mySecret -p myApp -e production -f .env.prod -r 5',
      'Specifies all options at once'
    )
  const result = await smenv(argv)

  if (!result.isDiff) {
    log(
      'green',
      `local file "${result.fileName}" is synced with "${result.secretName}"`
    )
    return
  }
  const {
    filesDiff: { added, deleted, updated },
    backupFileName,
    secretName,
    fileName,
    deletedFiles
  } = result

  log('magenta', `diff found from local file "${fileName}" to "${secretName}"`)

  if (!isEmpty(added)) {
    log(
      'green',
      `Added ${Object.keys(added).length} secrets: ${JSON.stringify(added)}`
    )
  }
  if (!isEmpty(deleted)) {
    log(
      'red',
      `Removed ${Object.keys(deleted).length} secrets: ${JSON.stringify(
        deleted
      )}`
    )
  }
  if (!isEmpty(updated)) {
    log(
      'yellow',
      `Updated ${Object.keys(updated).length} secrets: ${JSON.stringify(
        updated
      )}`
    )
  }
  if (backupFileName) {
    log('cyan', `back up file created: ${backupFileName}`)
  }
  if (deletedFiles) {
    log('red', `old backup files deleted: ${deletedFiles}`)
  }
}

main().catch((error) => {
  console.error('smenv error:', error)
})
