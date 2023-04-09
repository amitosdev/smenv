# smenv
`smenv` is a Node.js library and command-line tool for fetching secrets from AWS Secrets Manager and updating local environment files. It allows you to keep your sensitive information securely in AWS Secrets Manager and easily sync it with your local environment files.

## Installation
You can install `smenv` as a dependency in your Node.js project using `npm` or `yarn`:

```bash
npm install smenv
```
or

```bash
yarn add smenv
```

## Usage

### Library
You can use `smenv` as a library in your Node.js code as shown in the following example:

```javascript
const smenv = require('smenv')
const isEmpty = require('lodash.isempty')
  
;(async () => {
  const result = await smenv({
    secretName: 'mySecret', // The name of the secret to fetch from AWS Secrets Manager
    packageName: 'myApp', // The name of the package (optional, default is value from package.json in current directory)
    env: 'production', // The environment name (optional, default is NODE_ENV environment variable or 'development')
    fileName: '.env.prod', // The name of the file to write secrets to (optional, default is '.env')
    backupFileRetentionAmount: 5 // The number of backup files to retain (optional, default is 3)
  })

  if (!result.isDiff) {
    console.log(
      `Local file "${result.fileName}" is synced with "${result.secretName}"`
    )
  } else {
    console.log(
      `Diff found from local file "${result.fileName}" to "${result.secretName}":`
    )
    const { added, deleted, updated } = result.filesDiff

    if (!isEmpty(added)) {
      console.log(
        `Added ${Object.keys(added).length} secrets: ${JSON.stringify(added)}`
      )
    }
    if (!isEmpty(deleted)) {
      console.log(
        `Removed ${Object.keys(deleted).length} secrets: ${JSON.stringify(
          deleted
        )}`
      )
    }
    if (!isEmpty(updated)) {
      console.log(
        `Updated ${Object.keys(updated).length} secrets: ${JSON.stringify(
          updated
        )}`
      )
    }
    if (result.backupFileName) {
      console.log(`Backup file created: ${result.backupFileName}`)
    }
    if (result.deletedFiles) {
      console.log(`Old backup files deleted: ${result.deletedFiles}`)
    }
  }
})()

```
### Command-line tool
You can also use `smenv` as a command-line tool by running the `smenv` command with the following options:

```bash
Usage: cli.js [options]

Options:
      --help             Show help                                     [boolean]
      --version          Show version number                           [boolean]
  -s, --secretName       The name of the secret to fetch from AWS Secrets
                         Manager                                        [string]
  -p, --packageName      The name of the package
                [string] [default: value from package.json in current directory]
  -e, --env              The environment name
              [string] [default: NODE_ENV environment variable or 'development']
  -f, --fileName         The name of the file to write secrets to
                                                        [string] [default: .env]
  -r, --backupRetention  The number of backup files to retain
                                                           [number] [default: 3]

Examples:
  cli.js --secretName mySecret              Fetches the specified secret from
                                            AWS Secrets Manager
  cli.js --packageName myApp --env          Specifies custom package name and
  production                                environment
  cli.js -s mySecret -p myApp -e            Specifies all options at once
  production -f .env.prod -r 5
```

## License
This project is licensed under the Apache-2.0