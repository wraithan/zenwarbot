var util = require('util')
var Writable = require('stream').Writable
module.exports = createParser

function createParser (bot) {
  return new Parser(bot)
}

util.inherits(Parser, Writable)
function Parser (bot) {
  Writable.call(this, {decodeStrings: false})
  this.bot = bot
}

Parser.prototype._write = function _write (chunk, enc, done) {
  var line = chunk.trim()
  if (line.length === 0) {
    return done()
  }
  var parts = line.split(' ')
  var command = parts.shift()
  this.bot.emit(command, parts)

  if (this.bot._events[command] === undefined) {
    this.bot.logger.write('unhandled command: ' + chunk + '\n')
  }

  done()
}
