var fs = require('fs')
var path = require('path')
var runOne = require('./run-one.js')

process.setMaxListeners(30)

fs.readdir(path.join(__dirname, 'fodder'), function runFiles (err, files) {
  if (err) throw new Error(err)

  for (var i = 0; i < files.length; ++i) {
    var file = path.join(__dirname, 'fodder', files[i])
    console.log('Kicked off: %s', file)
    runOne(file)
  }
})
