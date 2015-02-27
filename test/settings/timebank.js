var assert = require('assert')
var util = require('util')
var Bot = require('../../bot.js')

var TIMEBANK = 234980
var line = util.format('settings timebank %s', TIMEBANK)

var bot = new Bot()

bot.processLine(line)

assert.strictEqual(bot.options.timebank, TIMEBANK)
