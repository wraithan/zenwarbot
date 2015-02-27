var assert = require('assert')
var util = require('util')
var Bot = require('../../bot.js')

var MY_BOT_NAME = "Jim"
var line = util.format('settings your_bot %s', MY_BOT_NAME)

var bot = new Bot()

bot.processLine(line)

assert.strictEqual(bot.options.your_bot, MY_BOT_NAME)
