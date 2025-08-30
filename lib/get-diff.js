import { detailedDiff } from 'deep-object-diff'

export function getDiff(currentObj, newObj) {
  return detailedDiff(currentObj, newObj)
}
