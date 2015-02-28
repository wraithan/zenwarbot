var assert = require('assert')
var util = require('util')
var createBot = require('../../bot.js')

var STARTING_ARMIES = 23
var line = util.format('settings starting_armies %s', STARTING_ARMIES)

var bot = createBot()

bot.processLine(line)

assert.strictEqual(bot.options.starting_armies, STARTING_ARMIES)
