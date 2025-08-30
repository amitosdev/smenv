export function getSecretName(secretName, packageName, environment) {
  if (secretName) return secretName
  return `${packageName}/${environment}`
}
