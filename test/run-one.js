var assert = require('assert')
var format = require('util').format
var fs = require('fs')
var bot = require('../lib/bot.js')
var split = require('split')
var through = require('through')

if (require.main === module) {
  runOne(process.argv[2], process.stderr)
}

module.exports = runOne

var notContains = /!\[(.*)\]/
var contains = /\[(.*)\]/

function runOne (filename, logger) {
  if (logger === undefined) {
    logger = through()
  }
  var lastLine
  var expected = []
  process.on('exit', function assertCorrect () {
    var not = notContains.exec(expected)
    if (not) {
      assert.equal(
        lastLine.indexOf(not[1]),
        (-1),
        format('\n"%s"\n\nshould not contain\n\n"%s"\n', lastLine, not[1])
      )
      return
    }

    var fragment = contains.exec(expected)
    if (fragment) {
      assert.notEqual(
        lastLine.indexOf(fragment[1]),
        (-1),
        format('\n"%s"\n\nshould contain\n\n"%s"\n', lastLine, fragment[1])
      )
      return
    }

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
