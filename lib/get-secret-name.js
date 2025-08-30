export function getSecretName({ secretName, packageName, environment }) {
  if (secretName) return secretName
  if (!packageName || !environment)
    throw new Error('Either secretName or both packageName and environment must be provided')
  return `${packageName}-${environment}`
}
