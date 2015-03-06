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
  this.duration = 0
  this.round = 0
  this.input = input
  this.output = output
  this.logger = logger
  this.settings = {}
  this.gameMap = createMap()
  this.placements = []
  this.transfers = []
  this.transferTargets = []
  this.attacks = []

  input.pipe(split()).pipe(parser(this))

  this.on('settings', this.handleSettings.bind(this))
  this.on('setup_map', this.handleSetupMap.bind(this))
  this.on('pick_starting_region', this.handleStartingRegions.bind(this))
  this.on('go', this.handlePlaceAttack.bind(this))

  this.on('update_map', this.gameMap.handleUpdate.bind(this.gameMap))

  this.on('opponent_moves', this.handleOpponentMoves.bind(this))
  this.on('#', this.handleComment.bind(this))
  this.on('Round', this.handleComment.bind(this, 'Round'))
  this.on('Output', this.handleComment.bind(this, 'Output'))
}

Bot.prototype.handlePlaceAttack = function handlePlaceAttack (data) {
  var mode = data.shift()

  var toProcess = this.gameMap.onEnemyBorder()

  toProcess.sort(function sortByEnemyCount(a, b) {
    return b.getNeighboringEnemies().length - a.getNeighboringEnemies().length
  })

  var lastToProcess = this.gameMap.notOnEnemyBorder()

  lastToProcess.sort(function sortByNeutralValue(a, b) {
    return b.averageNeutralSRBonus() - a.averageNeutralSRBonus()
  })

  toProcess = toProcess.concat(lastToProcess)

  var important = toProcess[0]
  var currentRegion
  var neighboringAllies
  var neighboringEnemies
  var neighboringNeutrals
  var sourceRegion
  var targetRegion
  var maxAttack
  var minAttack
  var needed
  var i
  while (toProcess.length > 0) {
    currentRegion = toProcess.shift()
    neighboringAllies = currentRegion.getNeighboringAllies()
    for (i = 0; i < neighboringAllies.length; ++i) {
      sourceRegion = neighboringAllies[i]
      if (!sourceRegion.bordersEnemy() &&
          sourceRegion.troopCount > 1 &&
          this.transferTargets.indexOf(sourceRegion.id) === -1) {
        this.transfers.push([
          sourceRegion.id,
          currentRegion.id,
          sourceRegion.troopCount - 1
        ])
        this.transferTargets.push(currentRegion.id)
        sourceRegion.troopCount = 1
      }
    }
    neighboringEnemies = currentRegion.getNeighboringEnemies()
    neighboringEnemies.sort(sortByPower)
    for (i = 0; i < neighboringEnemies.length; ++i) {
      targetRegion = neighboringEnemies[i]
      maxAttack = currentRegion.troopCount - 1
      minAttack = (targetRegion.troopCount * 2) - 1
      if (minAttack < 2) {
        minAttack = 2
      }
      if (maxAttack >= minAttack) {
        if (neighboringEnemies.length === 1) {
          minAttack = maxAttack
          currentRegion.troopCount = 1
        }
        this.attacks.push([
          currentRegion.id,
          targetRegion.id,
          minAttack
        ])
        currentRegion.troopCount -= minAttack
        continue
      }
      needed = minAttack - maxAttack
      if (this.settings.armies >= needed) {
        this.placements.push([currentRegion.id, needed])
        this.settings.armies -= needed
        this.attacks.push([
          currentRegion.id,
          targetRegion.id,
          minAttack
        ])
        currentRegion.troopCount -= minAttack
      }
    }
    // Don't go into neutral stuff if we border an enemy
    if (currentRegion.bordersEnemy()) {
      continue
    }

    neighboringNeutrals = currentRegion.getNeighboringNeutrals()
    var neutralValues = neighboringNeutrals.map(
      calcNeutralValue.bind(null, currentRegion.superRegion)
    )
    neutralValues.sort(sortByValueProp)
    for (i = 0; i < neutralValues.length; ++i) {
      targetRegion = neutralValues[i].region
      maxAttack = currentRegion.troopCount - 1
      minAttack = (targetRegion.troopCount * 2) - 1
      if (minAttack < 2) {
        minAttack = 2
      }
      if (maxAttack >= minAttack) {
        if (neighboringNeutrals.length === 1) {
          minAttack = maxAttack
          currentRegion.troopCount = 1
        }
        this.log(
          "attacking %s with %s from %s with score %s",
          targetRegion.id,
          minAttack,
          currentRegion.id,
          neutralValues[i].value
        )
        this.attacks.push([
          currentRegion.id,
          targetRegion.id,
          minAttack
        ])
        currentRegion.troopCount -= minAttack
        continue
      }
      needed = minAttack - maxAttack
      if (this.settings.armies >= needed) {
        this.placements.push([currentRegion.id, needed])
        this.settings.armies -= needed
        this.log(
          "attacking %s with %s from %s with score %s",
          targetRegion.id,
          minAttack,
          currentRegion.id,
          neutralValues[i].value
        )
        this.attacks.push([
          currentRegion.id,
          targetRegion.id,
          minAttack
        ])
        currentRegion.troopCount -= minAttack
        continue
      }
    }
  }

  if (this.settings.armies > 0) {
    this.placements.push([important.id, this.settings.armies])
    important.troopCount += this.settings.armies
    this.settings.armies = 0
  }

  var response = ''
  switch (mode) {
  case 'place_armies':
    for (i = 0; i < this.placements.length; ++i) {
      if (response.length !== 0) {
        response += ', '
      }
      response += players.us + ' place_armies ' + this.placements[i].join(' ')
    }
    if (response) {
      this.output.write(response + '\n')
    }
    this.placements = []
    break
  case 'attack/transfer':
    for (i = 0; i < this.transfers.length; ++i) {
      if (response.length !== 0) {
        response += ', '
      }
      response += players.us + ' attack/transfer ' + this.transfers[i].join(' ')
    }
    for (i = 0; i < this.attacks.length; ++i) {
      if (response.length !== 0) {
        response += ', '
      }
      response += players.us + ' attack/transfer ' + this.attacks[i].join(' ')
    }
    if (response) {
      this.output.write(response + '\n')
    }
    this.transfers = []
    this.transferTargets = []
    this.attacks = []
    break
  default:
    this.logger.write('unhandled mode in go: ' + mode + ': ' + data + '\n')
    break
  }
}

function sortByPower (a, b) {
  var aValue = ((a.troopCount * 100) +
                (a.superRegion.bonus * 10) +
                a.neighbors.length)
  var bValue = ((b.troopCount * 100) +
                (b.superRegion.bonus * 10) +
                b.neighbors.length)
  return bValue - aValue
}

function calcNeutralValue (superRegion, region) {
  var value = (
    100 -
    (region.troopCount * 10) +
    (region.superRegion.bonus * 10) +
    region.neighbors.length +
    (superRegion === region.superRegion ? 30 : 0)
  )
  return {region: region, value: value}
}

function sortByValueProp (a, b) {
  return b.value - a.value
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
    value -= region.superRegion.regions.length * 5
    value += region.superRegion.bonus * 3
    this.log(
      'SuperRegion: %s, Region: %s, Value: %s',
      region.superRegion.id,
      region.id, value
    )
    if (!best || value > best.value) {
      best = {
        region: region,
        value: value
      }
    }
  }
  this.output.write(best.region.id.toString() + '\n')
}

Bot.prototype.handleOpponentMoves = function handleOpponentMoves () {
  if (this.round !== 0) {
    this.log('Round %s end, took %s µs', this.round, this.duration)
  } else {
    this.log('Init took %s µs', this.duration)
  }
  this.round += 1

  this.duration = 0
}

Bot.prototype.handleComment = function handleComment (type, data) {
  if (data) {
    type += ' '
  } else {
    data = type
    type = ''
  }
  this.logger.write('# ' + type + data.join(' ') + '\n')
}

Bot.prototype.log = function log () {
  this.logger.write(util.format.apply(null, arguments) + '\n')
}
