var assert = require('assert')
var fs = require('fs')
var bot = require('../lib/bot.js')
var split = require('split')
var through = require('through')

if (require.main === module) {
  runOne(process.argv[2], process.stderr)
}

module.exports = runOne

function runOne (filename, logger) {
  if (logger === undefined) {
    logger = through()
  }
  var lastLine
  var expected
  process.on('exit', function assertCorrect () {
    assert.equal(lastLine, expected)
  })

  var VALID = '# Valid:'
  var inputProcessor = through(function write (chunk) {
    if (chunk.indexOf(VALID) !== 0) {
      return this.queue(chunk + '\n')
    }
    expected = chunk.substring(VALID.length).trim()
  })

  var outputProcesor = through(function write (chunk) {
    var line = chunk.trim()
    if (line) {
      lastLine = line
    }
  })

  fs.createReadStream(filename).pipe(split()).pipe(inputProcessor)

  var op = split().pipe(outputProcesor)

  bot(inputProcessor, op, logger)
}
