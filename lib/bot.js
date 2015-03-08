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
  this.neutralTargets = []

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
  var sourceRegion
  var targetRegion
  var maxAttack
  var minAttack
  var needed
  var i
  while (toProcess.length > 0) {
    currentRegion = toProcess.shift()

    neighboringAllies = currentRegion.getNeighboringAllies()
    if (currentRegion.bordersEnemy()) {
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
    } else if (!currentRegion.bordersNeutral()) {
      for (i = 0; i < neighboringAllies.length; ++i) {
        sourceRegion = neighboringAllies[i]
        if (!(sourceRegion.bordersEnemy() ||
              sourceRegion.bordersNeutral()) &&
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
    }

    neighboringEnemies = currentRegion.getNeighboringEnemies()
    neighboringEnemies.sort(sortByPower)
    for (i = 0; i < neighboringEnemies.length; ++i) {
      targetRegion = neighboringEnemies[i]
      maxAttack = currentRegion.troopCount - 1
      minAttack = ((targetRegion.troopCount + targetRegion.reinforcement) * 2) - 1
      if (minAttack < 2) {
        minAttack = 4
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
  }

  this.attackNeutrals()

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
    } else {
      this.output.write('no moves\n')
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
    } else {
      this.output.write('no moves\n')
    }
    this.transfers = []
    this.transferTargets = []
    this.attacks = []
    this.neutralTargets = []
    break
  default:
    this.logger.write('unhandled mode in go: ' + mode + ': ' + data + '\n')
    break
  }
}

Bot.prototype.attackNeutrals = function attackNeutrals () {
  var possibleTargets = this.gameMap.neutralsOnAllyBorder()
  possibleTargets = possibleTargets.map(calcNeutralValue.bind(this))
  possibleTargets.sort(sortByValueProp)
  for (var i = 0; i < possibleTargets.length; ++i) {
    var targetRegion = possibleTargets[i].region
    var minAttack = (targetRegion.troopCount * 2) - 1
    if (minAttack < 2) minAttack = 2

    var neighboringAllies = targetRegion.getNeighboringAllies()
    neighboringAllies.sort(sortByTroopCount)
    for (var j = 0; j < neighboringAllies.length; ++j) {
      var sourceRegion = neighboringAllies[j]
      if (sourceRegion.bordersEnemy()) {
        continue
      }

      var attackValue = 0
      var difference = (sourceRegion.troopCount - 1) - minAttack
      if (difference >= 0) {
        attackValue = minAttack
      } else if (this.settings.armies + difference >= 0) {
        this.log(
          'placing %s troops on %s to attack %s',
          Math.abs(difference),
          sourceRegion.id,
          targetRegion.id
        )
        this.placements.push([sourceRegion.id, Math.abs(difference)])
        this.settings.armies += difference
        attackValue = minAttack
        sourceRegion.troopCount += Math.abs(difference)
      }
      if (attackValue) {
        if (sourceRegion.bordersNeutral()) {
          attackValue = sourceRegion.troopCount - 1
        }
        this.log(
          'attacking %s from %s with %s',
          targetRegion.id,
          sourceRegion.id,
          attackValue
        )
        this.attacks.push([sourceRegion.id, targetRegion.id, attackValue])
        sourceRegion.troopCount -= attackValue
        break
      }
    }
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

function sortByTroopCount (a, b) {
  return b.troopCount - a.troopCount
}

function calcNeutralValue (region) {
  var value = (
    1000 - (region.troopCount * 100) +
      (region.superRegion.bonus * 10) +
      (region.superRegion.bonus * (100 * region.superRegion.percentOwned())) +
    region.neighbors.length
  )
  this.log('calculated neutral %s to be worth %s', region.id, value)
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

Bot.prototype.handleOpponentMoves = function handleOpponentMoves (data) {
  this.newRound() // round ticker

  var region

  for (var i = 0; i < data.length;) {
    if (data[i] !== players.them) {
      return this.log('Unknown input: %s at position %s', data, i)
    }

    switch (data[i + 1]) {
    case 'place_armies':
      region = this.gameMap.regionsById[parseInt(data[i + 2], 10)]
      region.reinforcement += parseInt(data[i + 3], 10)
      i += 4
      break
    case 'attack/transfer':
      i += 5
      break
    default:
      return this.log('Unknown input: %s at position %s', data, i + 1)
    }
  }
}

Bot.prototype.newRound = function newRound () {
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
