var assert = require('assert')
var util = require('util')
var Bot = require('../../bot.js')

var OTHER_BOT_NAME = "RandomBot"
var line = util.format('settings opponent_bot %s', OTHER_BOT_NAME)

var bot = new Bot()

bot.processLine(line)

assert.strictEqual(bot.options.opponent_bot, OTHER_BOT_NAME)
