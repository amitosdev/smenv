const { detailedDiff } = require('deep-object-diff')
module.exports = (currentObj, newObj) => {
  return detailedDiff(currentObj, newObj)
}
