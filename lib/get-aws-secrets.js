import { getSecretsClient } from 'mysterio'

export function getAwsSecrets(secretName, awsSettings) {
  const getSecrets = getSecretsClient(awsSettings)
  return getSecrets(secretName)
}
