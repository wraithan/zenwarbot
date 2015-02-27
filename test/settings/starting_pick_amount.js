var assert = require('assert')
var util = require('util')
var Bot = require('../../bot.js')

var STARTING_PICK_AMOUNT = 234
var line = util.format('settings starting_pick_amount %s', STARTING_PICK_AMOUNT)

var bot = new Bot()

bot.processLine(line)

assert.strictEqual(bot.options.starting_pick_amount, STARTING_PICK_AMOUNT)