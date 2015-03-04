var EventEmitter = require('events').EventEmitter
var util = require('util')
var split = require('split')
var parser = require('./parser.js')
var createMap = require('./map.js')
var players = require('./players.js')

module.exports = createBot

function createBot (input, output, logger) {
  return new Bot(input, output, logger)
}

util.inherits(Bot, EventEmitter)
function Bot (input, output, logger) {
  EventEmitter.call(this)
  this.input = input
  this.output = output
  this.logger = logger
  this.settings = {}
  this.gameMap = createMap()

  input.pipe(split()).pipe(parser(this))

  this.on('settings', this.handleSettings.bind(this))
  this.on('setup_map', this.handleSetupMap.bind(this))
  this.on('pick_starting_region', this.handleStartingRegions.bind(this))
  this.on('go', this.handlePlaceAttack.bind(this))

  this.on('update_map', this.gameMap.handleUpdate.bind(this.gameMap))

  this.on('opponent_moves', function noop() {})
  this.on('Round', this.handleComment.bind(this, 'Round'))
  this.on('Output', this.handleComment.bind(this, 'Output'))
}

Bot.prototype.handlePlaceAttack = function handlePlaceAttack (data) {
  var mode = data.shift()
  var placements = []
  var transfers = []
  var attacks = []

  switch (mode) {
  case 'place_armies':
    break
  case 'attack/transfer':
    break
  default:
    this.logger.write('unhandled mode in go: ' + mode + ': ' + data + '\n')
    break
  }
}

Bot.prototype.handleSettings = function handleSettings (data) {
  var type = data.shift()

  switch (type) {
  case 'starting_armies':
    this.settings.armies = parseInt(data[0], 10)
    break
  case 'your_bot':
    players.us = data[0]
    break
  case 'opponent_bot':
    players.them = data[0]
    break
  case 'max_rounds':
  case 'time_per_move':
  case 'timebank':
  case 'starting_regions':
  case 'starting_pick_amount':
    // Do not handle these yet, maybe in the future
    break
  default:
    this.logger.write('Unhandled settings: ' + type + ': ' + data + '\n')
    break
  }
}

Bot.prototype.handleSetupMap = function handleSetupMap(data) {
  var type = data.shift()
  var i = 0

  switch (type) {
  case 'super_regions':
    for (i = 0; i < data.length; i += 2) {
      this.gameMap.addSuperRegion(parseInt(data[i], 10), parseInt(data[i + 1], 10))
    }
    break
  case 'regions':
    for (i = 0; i < data.length; i += 2) {
      this.gameMap.addRegion(parseInt(data[i], 10), parseInt(data[i + 1], 10))
    }
    break
  case 'neighbors':
    for (i = 0; i < data.length; i += 2) {
      var neighbors = data[i + 1].split(',')
      for (var j = 0; j < neighbors.length; ++j) {
        neighbors[j] = parseInt(neighbors[j], 10)
      }
      this.gameMap.addNeighbors(parseInt(data[i], 10), neighbors)
    }
    break
  case 'wastelands':
    for (i = 0; i < data.length; ++i) {
      data[i] = parseInt(data[i], 10)
    }
    this.gameMap.addWastelands(data)
    break
  case 'opponent_starting_regions':
    for (i = 0; i < data.length; ++i) {
      this.gameMap.regionsById[parseInt(data[i], 10)].owner = players.them
    }
    break
  default:
    this.logger.write('Unhandled setup_map: ' + type + ': ' + data + '\n')
    break
  }
}

Bot.prototype.handleStartingRegions = function handleStartingRegions (ids) {
  // drop remaining timebank
  ids.shift()
  var best
  for (var i = 0; i < ids.length; i++) {
    var region = this.gameMap.regionsById[parseInt(ids[i], 10)]
    var value = 100
    value -= region.superRegion.wastelandCount * 10
    value -= region.superRegion.regions * 5
    value += region.superRegion.bonus * 3
    if (!best || value > best.value) {
      best = {
        region: region,
        value: value
      }
    }
  }
  this.output.write(best.region.id.toString() + '\n')
}

Bot.prototype.handleComment = function handleComment(type, data) {
  this.logger.write('# ' + type + ' ' + data.join(' ') + '\n')
}
