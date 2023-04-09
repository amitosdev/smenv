const { getSecretsClient } = require('mysterio')

const getSecrets = getSecretsClient({})
module.exports = (secretName) => {
  return getSecrets(secretName)
}
