const clc = require('cli-color')
module.exports = (color, msg) => {
  console.log(clc[color]('[smenv]: ' + msg))
}
