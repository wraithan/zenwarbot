var split = require('split')
var GameMap = require('./map/Map.js')
var SuperRegion = require('./map/SuperRegion.js')
var Region = require('./map/Region.js')
var PossibleOwners = require('./map/PossibleOwners.js')

module.exports = initBot

function initBot(input, output) {
  return new Bot(input, output)
}

/**
 * Main class
 * Initializes a map instance and an empty settings object
 */
function Bot (input, output) {
  if (!(this instanceof Bot)) {
    return new Bot(input, output)
  }

  // Will have a stream in real life, but might not have one in testing
  if (input) {
    input.pipe(split()).on('data', this.processLine.bind(this))
  }

  this.output = output

  // initialize options object
  this.options = {}

  // initialize map
  this.map = new GameMap()
}

Bot.prototype.processLine = function processLine (data) {
  // stop if line doesn't contain anything
  if (data.length === 0) {
    return
  }

  var lineParts = data.trim().split(' ')

  // stop if lineParts doesn't contain anything
  if (lineParts.length === 0) {
    return
  }
  this.processCommand(lineParts.shift(), lineParts)

}

Bot.prototype.processCommand = function processCommand (command, data) {
  // var start = process.hrtime()
  switch (command) {
    case 'settings':
      this.processSetting(data.shift(), data)
      break

    default:
      var camelCommand = toCamelCase(command)

      if (camelCommand in this) {
        var response = this[camelCommand](data)

        if (response && response.length > 0) {
          this.output.write(response + '\n')
        }
      } else {
        process.stderr.write(
          'Unable to execute command: ' + camelCommand + ' with data: ' + data + '\n'
        )
      }
  }
  // var end = process.hrtime(start)
  // process.stderr.write('turn took: ' + ((end[0] * 1e6) + (end[1] / 1e3)) + 'μs\n')
}

Bot.prototype.processSetting = function processSetting (setting, value) {
  switch (setting) {
    case 'max_rounds':
    case 'starting_armies':
    case 'starting_pick_amount':
    case 'time_per_move':
    case 'timebank':
      this.options[setting] = parseInt(value[0], 10)
      break
    case 'starting_regions':
      this.options[setting] = value
      break
    default:
      this.options[setting] = value[0]
  }
}

Bot.prototype.setupMap = function setupMap (data) {
  var command = toCamelCase('setup_' + data.shift())

  if (command in this) {
    this[command](data)
  } else {
    process.stderr.write(
      'Unable to understand command: ' + command + ', with data: ' + data
    )
  }
}

/**
 * Bot.setupSuperRegions
 * Initializes all super regions and assigns their bonuses
 *
 * @param Array data
 */
Bot.prototype.setupSuperRegions = function setupSuperRegions (data) {
  var i,
    continentId,
    continentBonus

  // loop through data in pairs of two
  for (i = 0; i + 1 < data.length; i += 2) {
    // get continent id
    continentId = parseInt(data[i], 10)

    // get continent bonus
    continentBonus = parseInt(data[i + 1], 10)

    // store content in continents object
    this.map.superRegions[continentId] = new SuperRegion(continentId, continentBonus)
  }
}

/**
 * Bot.setupRegions
 * Initializes all regions and sets their superRegions
 *
 * @param Array data
 */
Bot.prototype.setupRegions = function setupRegions (data) {
  var i,
    regionId,
    continent

  // loop through data in pairs of two
  for (i = 0; i + 1 < data.length; i += 2) {
    // get region id
    regionId = parseInt(data[i], 10)

    // get continent id
    continent = this.map.getSuperRegionById(parseInt(data[i + 1], 10))

    // store region in regions object
    this.map.regions[regionId] = new Region(regionId, continent)
  }
}

/**
 * Bot.setupNeighbors
 * Is used to update each regions neighbors according to data
 *
 * @param Array data
 */
Bot.prototype.setupNeighbors = function setupNeighbors (data) {
  var i,
    j,
    region,
    regionId,
    neighbor,
    neighborIds

  // loop through data in pairs of two
  for (i = 0; i + 1 < data.length; i += 2) {
    // get region by id
    regionId = parseInt(data[i], 10)
    region = this.map.getRegionById(regionId)

    // strip the string of brackets and convert to array
    neighborIds = data[i + 1].replace('[', '').replace(']', '').split(',')

    for (j = 0; j < neighborIds.length; j++) {
      // get the neighbor by Id
      var neigborId = parseInt(neighborIds[j], 10)
      neighbor = this.map.getRegionById(neigborId)

      // connect region with its neighbor
      neighbor.neighbors.push(region)
      region.neighbors.push(neighbor)
    }
  }
}

/**
 * Bot.setupWastelands
 * Is used to set the amount of armies on the wastelands
 *
 * @param Array data
 */
Bot.prototype.setupWastelands = function setupWastelands (data) {
  for (var i = 0; i < data.length; ++i) {
    var region = this.map.getRegionById(parseInt(data[i], 10))

    // this really shouldn't be hard coded
    region.troopCount = 6
    region.superRegion.wastelands++
  }
}

/**
 * Bot.updateMap
 * Is used to update our map every round
 *
 * @param Array data
 */
Bot.prototype.updateMap = function updateMap (data) {
  var botName = this.options.your_bot
  // loop through data in sets of three
  var handled = []
  for (var i = 0; i < data.length; i += 3) {
    // get region by id
    var regionId = parseInt(data[i], 10)
    handled.push(regionId)
    var region = this.map.getRegionById(regionId)

    // update region owner
    region.owner = data[i + 1]

    // update troopcount
    region.troopCount = parseInt(data[i + 2], 10)
  }

  var regions = this.map.getRegions()
  for (var j = 0; j < regions.length; ++j) {
    var mapRegion = regions[j]
    if (handled.indexOf(mapRegion.id) === -1 && mapRegion.owner === botName) {
      mapRegion.owner = this.options.opponent_bot
    }
  }
}

/**
 * Bot.pickStartingRegion
 * Is used to select initial starting regions.
 *
 * @param Array data
 * @return String
 */
Bot.prototype.pickStartingRegion = function pickStartingRegion (data) {
  // drop the time left
  data.shift()

  return this.rankRegions(data)[0]
}

Bot.prototype.rankRegions = function rankRegions (regionIds) {
  var bot = this

  var ranking = regionIds.map(function regionIdToRanking (regionId, index) {
    var region = bot.map.getRegionById(parseInt(regionId, 10))
    var value = 100
    value -= region.superRegion.wastelands * 10
    value -= Object.keys(region.superRegion.regions).length * 5
    value += region.superRegion.bonus * 3
    return {index: index, value: value, region: regionId}
  })

  ranking.sort(function sortByValue (a, b) {
    return b.value - a.value
  })

  var result = ranking.map(function buildResult (e) {
    return regionIds[e.index]
  })

  return result
}

/**
 * Bot.go
 * Calls placeArmies or attackTransfer depending on first item in data
 *
 * @param Array data
 * @return string
 */
Bot.prototype.go = function go (data) {
  var command = toCamelCase(data.shift())
  if (!(command in this)) {
    process.stderr.write(
      'Unable to understand command: ' + command + ', with data: ' + data
    )
  }

  return this[command](data)
}

/**
 * Bot.placeArmies
 * Is used to place troops. Currently places each army on a random region
 *
 * @param Array data
 * @return string
 */
Bot.prototype.placeArmies = function placeArmies () {
  var region
  var parsedPlacements = ''
  var placements = []
  var regionIndex = 0
  var troopsRemaining = parseInt(this.options.starting_armies, 10)
  var ownedRegions = this.map.getOwnedRegions(this.options.your_bot)
  var enemyRegions = this.map.getOwnedRegions(this.options.opponent_bot)
  var inNeed = []
  var enemy
  var neighboringEnemy
  var placing = 0

  ownedRegions.sort(function sortRegions (a, b) {
    var aValue = a.filterNeighbors(PossibleOwners.NEUTRAL).length
    var bValue = b.filterNeighbors(PossibleOwners.NEUTRAL).length
    return bValue - aValue
  })

  for (var i = 0; i < enemyRegions.length; ++i) {
    enemy = enemyRegions[i]
    neighboringEnemy = enemy.filterNeighbors(this.options.your_bot)
    for (var j = 0; j < neighboringEnemy.length; ++j) {
      var myRegion = neighboringEnemy[j]
      if (inNeed.indexOf(myRegion) === -1) {
        inNeed.push(neighboringEnemy[j])
      }
    }
  }

  inNeed.sort(function sortInNeed (a, b) {
    var aValue = a.filterNeighbors(PossibleOwners.NEUTRAL).length
    var bValue = b.filterNeighbors(PossibleOwners.NEUTRAL).length
    return bValue - aValue
  })

  while (troopsRemaining > 0) {
    if (inNeed.length >= 1) {
      region = inNeed[0]
      placing = Math.floor(troopsRemaining * 0.8)
      placements.push([region.id, placing])

      region.troopCount += placing
      troopsRemaining -= placing
      inNeed = []
      continue
    }

    if (troopsRemaining >= 2) {
      placing = 2
    } else {
      placing = 1
    }

    region = ownedRegions[regionIndex]

    // place a single army
    placements.push([region.id, placing])

    region.troopCount += placing
    troopsRemaining -= placing
    regionIndex = (regionIndex + 1) % ownedRegions.length
  }

  // parse the placements
  for (var k = 0; k < placements.length; k++) {
    parsedPlacements += (
      this.options.your_bot +
      ' place_armies ' +
      placements[k].join(' ')
    )

    if (k < placements.length - 1) {
      parsedPlacements += ', '
    }
  }

  return parsedPlacements
}

function sortByAttackOrder(name, a, b) {
  // default value for enemy
  var aValue = 2
  var bValue = 2
  if (a.owner === name) {
    // self worth no points
    aValue = 0
  } else if (a.owner === PossibleOwners.NEUTRAL) {
    // neutral worth less than enemy
    aValue = 1
  }
  if (b.owner === name) {
    // self worth no points
    bValue = 0
  } else if (b.owner === PossibleOwners.NEUTRAL) {
    // neutral worth less than enemy
    bValue = 1
  }
  // descending order
  return bValue - aValue
}

function sortByMoveOrder(name, a, b) {
  var aValue = 0
  aValue += a.filterNeighbors(name).length * 3
  aValue += a.filterNeighbors(PossibleOwners.NEUTRAL).length
  var bValue = 0
  bValue += b.filterNeighbors(name).length * 3
  bValue += b.filterNeighbors(PossibleOwners.NEUTRAL).length
  return bValue - aValue
}

Bot.prototype.attackTransfer = function attackTransfer () {
  var moves = []
  var ownedRegions = this.map.getOwnedRegions(this.options.your_bot)
  var n
  var targetRegion

  for (var i = 0; i < ownedRegions.length; i++) {
    var region = ownedRegions[i]
    var neighbors = region.neighbors.slice()
    neighbors.sort(sortByMoveOrder.bind(null, this.options.opponent_bot))
    // transfer troops to neighboring friendly region if troopCount > 1
    var anyNeutral = region.anyNeighbors(PossibleOwners.NEUTRAL)
    var anyEnemy = region.anyNeighbors(this.options.opponent_bot)
    if (region.troopCount > 1 && !anyNeutral && !anyEnemy) {
      for (n in neighbors) {
        // continue with the next iteration if n is a property of the neighbors array,
        // instead of an item in the array
        if (!region.neighbors.hasOwnProperty(n)) {
          continue
        }

        // set the target region
        targetRegion = region.neighbors[n]

        // transfer all available troops if target region is owned by bot
        if (this.options.your_bot === targetRegion.owner) {
          moves.push([region.id, targetRegion.id, region.troopCount - 1])
          region.troopCount = 1
          break
        }
      }
    }

    neighbors.sort(sortByAttackOrder.bind(null, this.options.your_bot))
    // attack neighboring enemy / neutral region if troopCount > 6
    if (region.troopCount >= 4) {
      // shuffle the neighbours for some randomness
      for (var j = 0; j < neighbors.length; ++j) {
        // set the target region
        targetRegion = neighbors[j]

        // attack with all available troops if target region is not owned by bot
        if (this.options.your_bot !== targetRegion.owner) {
          if ((region.troopCount - 1) > (targetRegion.troopCount * (10 / 7))) {
            moves.push([region.id, targetRegion.id, region.troopCount - 1])
            region.troopCount = 1
            break
          }
        }
      }
    }
  }

  // Return 'No moves' if no moves are made
  if (moves.length === 0) {
    return 'No moves'
  }
  var parsedMoves = ''
  // Else parse the moves
  for (i = 0; i < moves.length; i++) {
    parsedMoves += this.options.your_bot + ' attack/transfer ' + moves[i].join(' ')

    if (i < moves.length - 1) {
      parsedMoves += ','
    }
  }

  return parsedMoves
}

/**
 * Bot.opponentMoves
 * Can be used to parse the opponent_moves data, isn't used in the starter bot
 *
 * @param Array data
 */
Bot.prototype.opponentMoves = function opponentMoves (data) {
  process.stderr.write('opponentMoves:' + data + '\n')
}

Bot.prototype.setupOpponentStartingRegions = function setupOpponentStartingRegions(data) {
  for (var i = 0; i < data.length; i++) {
    this.map.getRegionById(parseInt(data[i], 10)).owner = this.options.opponent_bot
  }
}

function toCamelCase (input) {
  return input.replace('/', '_').replace(/_[a-z]/g, function replacer (match) {
    return match.toUpperCase().replace('_', '')
  })
}
