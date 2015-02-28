var assert = require('assert')
var util = require('util')
var createBot = require('../../bot.js')

var MAX_ROUNDS = 93872
var line = util.format('settings max_rounds %s', MAX_ROUNDS)

var bot = createBot()

bot.processLine(line)

assert.strictEqual(bot.options.max_rounds, MAX_ROUNDS)
