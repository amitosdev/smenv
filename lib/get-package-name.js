import { readFile } from 'node:fs/promises'
import path from 'node:path'

export async function getPackageName() {
  const pkgJson = await readFile(path.join(process.cwd(), 'package.json'), 'utf8')
  return JSON.parse(pkgJson).name
}
