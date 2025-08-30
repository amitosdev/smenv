# smenv 
`smenv` is a Node.js library and command-line tool for fetching secrets from AWS Secrets Manager and updating local environment files. It allows you to keep your sensitive information securely in AWS Secrets Manager and easily sync it with your local environment files.

## Installation

### As a project dependency
You can install `smenv` as a dependency in your Node.js project using `npm` or `yarn`:

```bash
npm install smenv
```
or

```bash
yarn add smenv
```

### Global installation (recommended)
For easy access across all projects, install `smenv` globally:

```bash
npm install -g smenv
```

This allows you to use the `smenv` command from anywhere on your system.

## AWS Secrets Manager Setup

Before using `smenv`, you need to store your secrets in AWS Secrets Manager with the correct naming convention:

### Secret Naming Structure
Secrets should be named using the format: `packageName/environment`

Examples:
- `my-app/local` - for local development
- `my-app/production` - for production environment  
- `my-app/staging` - for staging environment

### Secret Value Format
Store your environment variables as a JSON object in the secret value:

```json
{
  "DATABASE_URL": "postgresql://localhost:5432/myapp",
  "API_KEY": "your-api-key-here",
  "REDIS_URL": "redis://localhost:6379"
}
```

## Usage

### Library
You can use `smenv` as a library in your Node.js code as shown in the following example:

```javascript
import { smenv } from 'smenv'
import isEmpty from 'lodash.isempty'
  
;(async () => {
  const result = await smenv({
    secretName: 'mySecret', // The name of the secret to fetch from AWS Secrets Manager (optional)
    packageName: 'myApp', // The name of the package (optional, default is value from package.json in current directory)
    environment: 'production', // The environment name (optional, default is NODE_ENV environment variable or 'local')
    isSupportEnvironment: true, // Support environment-specific files like .env.production (optional, default is true)
    isBackupCurrentFile: false, // Create a backup of the current file before updating (optional, default is false)
    awsSettings: {}, // AWS configuration settings (optional, default is {})
    getAwsSecretsFunc: customGetSecrets // Custom function to retrieve secrets (optional, defaults to AWS Secrets Manager)
  })

  if (!result.isDiff) {
    console.log('Local environment file is synced with secrets')
  } else {
    console.log('Differences found between local file and secrets:')
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
  }
})()

```

#### Custom Secret Provider

You can provide your own function to retrieve secrets instead of using AWS Secrets Manager. The function must be async and follow this signature:

```typescript
async function getAwsSecretsFunc(secretName: string, awsSettings: object): Promise<object>
```

Example implementation:

```javascript
import { smenv } from 'smenv'

// Custom function to get secrets from your own source
// Parameters:
//   - secretName: string - The name of the secret to fetch (e.g., 'my-app-production')
//   - awsSettings: object - Configuration settings passed from smenv options
// Returns: Promise<object> - Object with key-value pairs of environment variables
async function myCustomSecretProvider(secretName, awsSettings) {
  console.log(`Fetching secrets for: ${secretName}`)
  
  // Your custom logic to fetch secrets
  // This could be from a database, API, file system, etc.
  if (secretName === 'my-app-production') {
    return {
      DATABASE_URL: 'postgresql://prod-db:5432/myapp',
      API_KEY: 'prod-api-key-12345',
      REDIS_URL: 'redis://prod-redis:6379'
    }
  }
  
  // Return empty object if secret not found, or throw error
  throw new Error(`Secret '${secretName}' not found`)
}

const result = await smenv({
  secretName: 'my-app-secrets',
  packageName: 'my-app',
  environment: 'production',
  getAwsSecretsFunc: myCustomSecretProvider // Use custom provider
})
```

### API Reference

#### smenv(options)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `secretName` | `string` | `undefined` | The name of the secret to fetch. If not provided, uses `packageName/environment` |
| `packageName` | `string` | package.json name | The name of the package/application |
| `environment` | `string` | `process.env.NODE_ENV \|\| 'local'` | The environment name (e.g., 'local', 'production', 'staging') |
| `isSupportEnvironment` | `boolean` | `true` | Whether to use environment-specific files (e.g., `.env.production`) |
| `isBackupCurrentFile` | `boolean` | `false` | Whether to create a backup before updating the file |
| `awsSettings` | `object` | `{}` | AWS configuration settings (region, credentials, etc.) |
| `getAwsSecretsFunc` | `function` | `getAwsSecrets` | Custom function to retrieve secrets. Receives `(secretName, awsSettings)` and should return an object of key-value pairs |

#### Return Value

The function returns a Promise that resolves to an object with:

| Property | Type | Description |
|----------|------|-------------|
| `isDiff` | `boolean` | Whether differences were found between local and remote secrets |
| `filesDiff` | `object` | Object containing `added`, `deleted`, and `updated` properties |
| `envs` | `object` | The final environment variables after synchronization |

### Command-line tool
You can also use `smenv` as a command-line tool by running the `smenv` command with the following options:

#### Recommended Usage in Projects
For the best developer experience, add `smenv` to your npm scripts to automatically sync secrets before starting your application:

```json
{
  "scripts": {
    "start": "smenv -e local && node server.js",
    "dev": "smenv -e development && npm run dev-server",
    "prod": "smenv -e production && npm start"
  }
}
```

This ensures your environment variables are always up-to-date with the latest secrets from AWS Secrets Manager before your application starts.

#### CLI Options

```bash
Usage: smenv [options]

Options:
      --help                Show help                                  [boolean]
      --version             Show version number                        [boolean]
  -s, --secretName          The name of the secret to fetch from AWS Secrets
                            Manager                                     [string]
  -p, --packageName         The name of the package
                [string] [default: value from package.json in current directory]
  -e, --env                 The environment name
              [string] [default: NODE_ENV environment variable or 'development']
  -f, --fileName            The name of the file to write secrets to
                                                        [string] [default: .env]
      --supportEnvironment  Support environment-specific files (e.g.,
                            .env.production)           [boolean] [default: true]
  -b, --backup              Create a backup of the current file before updating
                                                                       [boolean]

Examples:
  smenv --secretName mySecret              Fetches the specified secret from
                                            AWS Secrets Manager
  smenv --packageName myApp --env          Specifies custom package name and
  production                                environment
  smenv -s mySecret -p myApp -e            Specifies options with backup
  production --backup                       enabled
  smenv --backup                           Creates a backup of current .env file
                                            before updating
  smenv -b                                 Same as --backup (short form)
```

## License
This project is licensed under the Apache-2.0