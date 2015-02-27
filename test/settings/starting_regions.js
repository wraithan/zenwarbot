var assert = require('assert')
var util = require('util')
var Bot = require('../../bot.js')

var STARTING_REGIONS = [1, 5, 6, 12]
var line = util.format('settings starting_regions %s', STARTING_REGIONS.join(' '))

var bot = new Bot()

bot.processLine(line)

assert.deepEqual(bot.options.starting_regions, STARTING_REGIONS)
