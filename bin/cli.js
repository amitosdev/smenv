#!/usr/bin/env node
import isEmpty from 'lodash.isempty'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { smenv } from '../index.js'
import log from './log.js'

async function main() {
  const { argv } = yargs(hideBin(process.argv))
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
      supportEnvironment: {
        describe: 'Enable environment-specific files (e.g., .env.production)',
        defaultDescription: false,
        type: 'boolean'
      },
      backup: {
        alias: 'b',
        describe: 'Create a backup of the current file before updating',
        defaultDescription: false,
        type: 'boolean'
      }
    })
    .example('$0 --secretName mySecret', 'Fetches the specified secret from AWS Secrets Manager')
    .example('$0 --packageName myApp --env production', 'Specifies custom package name and environment')
    .example('$0 -s mySecret -p myApp -e production --backup', 'Specifies options with backup enabled')
    .example('$0 --backup', 'Creates a backup of current .env file before updating')
    .example('$0 -b', 'Same as --backup (short form)')
    .example('$0 --supportEnvironment', 'Uses environment-specific files like .env.production')

  const { isDiff, filesDiff } = await smenv({
    secretName: argv.secretName,
    packageName: argv.packageName,
    environment: argv.env,
    isSupportEnvironment: argv.supportEnvironment === true,
    isBackupCurrentFile: argv.backup === true
  })

  if (!isDiff) {
    log('green', 'local environment file is synced with AWS Secrets Manager')
    return
  }

  log('cyan', 'differences found between local .env file and AWS Secrets Manager')

  // Print added variables (green with +)
  if (!isEmpty(filesDiff.added)) {
    Object.entries(filesDiff.added).forEach(([key, value]) => {
      log('green', `+${key}=${value}`)
    })
  }

  // Print deleted variables (red with -)
  if (!isEmpty(filesDiff.deleted)) {
    Object.keys(filesDiff.deleted).forEach((key) => {
      log('red', `-${key}`)
    })
  }

  // Print updated variables (show new value)
  if (!isEmpty(filesDiff.updated)) {
    Object.entries(filesDiff.updated).forEach(([key, newValue]) => {
      log('yellow', `~${key}=${newValue}`)
    })
  }

  log('magenta', 'Environment variables synchronized with AWS Secrets Manager')
}

main().catch((error) => {
  console.error('smenv error:', error)
})
