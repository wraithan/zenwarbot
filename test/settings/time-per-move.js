var assert = require('assert')
var util = require('util')
var Bot = require('../../bot.js')

var TIME_PER_MOVE = 487392
var line = util.format('settings time_per_move %s', TIME_PER_MOVE)

var bot = new Bot()

bot.processLine(line)

assert.strictEqual(bot.options.time_per_move, TIME_PER_MOVE)
