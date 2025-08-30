import clc from 'cli-color'

export default (color, msg) => {
  console.log(clc[color](`[smenv]: ${msg}`))
}
