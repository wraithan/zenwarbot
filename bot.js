var split = require('split')
var GameMap = require('./map/Map.js')
var SuperRegion = require('./map/SuperRegion.js')
var Region = require('./map/Region.js')

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
          'Unable to execute command: ' + camelCommand + ' with data: ' + data
        )
      }
  }
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
    continentId

  // loop through data in pairs of two
  for (i = 0; i + 1 < data.length; i += 2) {
    // get region id
    regionId = parseInt(data[i], 10)

    // get continent id
    continentId = parseInt(data[i + 1], 10)

    // store region in regions object
    this.map.regions[regionId] = new Region(regionId, continentId)
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
  }
}

/**
 * Bot.updateMap
 * Is used to update our map every round
 *
 * @param Array data
 */
Bot.prototype.updateMap = function updateMap (data) {
  // loop through data in sets of three
  for (var i = 0; i < data.length; i += 3) {
    // get region by id
    var region = this.map.getRegionById(parseInt(data[i], 10))

    // update region owner
    region.owner = data[i + 1]

    // update troopcount
    region.troopCount = parseInt(data[i + 2], 10)
  }
}

/**
 * Bot.pickStartingRegion
 * Is used to select initial starting regions.
 * Currently selects six random regions.
 *
 * @param Array data
 * @return String
 */
Bot.prototype.pickStartingRegion = function pickStartingRegion (data) {
  // drop the time left
  data.shift()
  var randomRegion = shuffle(data).slice(0, 1)

  // parse to string
  return '' + randomRegion
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
  var i,
    region,
    parsedPlacements = '',
    placements = [],
    regionIndex = 0,
    troopsRemaining = parseInt(this.options.starting_armies, 10),
    ownedRegions = this.map.getOwnedRegions(this.options.your_bot)

  while (troopsRemaining > 0) {
    // get a random region
    regionIndex = Math.floor(Math.random() * ownedRegions.length)
    region = ownedRegions[regionIndex]

    // place a single army
    placements.push([region.id, 1])

    region.troopCount += 1
    troopsRemaining -= 1
    regionIndex += 1
  }

  // parse the placements
  for (i = 0; i < placements.length; i++) {
    parsedPlacements += this.options.your_bot + ' place_armies ' + placements[i].join(' ')

    if (i < placements.length - 1) {
      parsedPlacements += ', '
    }
  }

  return parsedPlacements
}

/**
 * Bot.attackTransfer
 * Method to attack another region or transfer troops to allied regions
 *
 * @param Array data
 * @return string
 */
Bot.prototype.attackTransfer = function attackTransfer () {
  var moves = [],
    ownedRegions = this.map.getOwnedRegions(this.options.your_bot),
    i,
    n,
    parsedMoves = '',
    region,
    targetRegion

  for (i = 0; i < ownedRegions.length; i++) {
    region = ownedRegions[i]
    var neighbors = shuffle(region.neighbors)

    // attack neighboring enemy / neutral region if troopCount > 6
    if (region.troopCount > 6) {
      // shuffle the neighbours for some randomness
      for (n in neighbors) {
        // continue with the next iteration if n is a property of the neighbors array,
        // instead of an item in the array
        if (!region.neighbors.hasOwnProperty(n)) {
          continue
        }

        // set the target region
        targetRegion = region.neighbors[n]

        // attack with all available troops if target region is not owned by bot
        if (this.options.your_bot !== targetRegion.owner) {
          moves.push([region.id, targetRegion.id, region.troopCount - 1])
          region.troopCount = 1
          break
        }
      }
    }

    // transfer troops to neighboring friendly region if troopCount > 1
    if (region.troopCount > 1) {
      // shuffle the neighbours for some randomness
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
  }

  // Return 'No moves' if no moves are made
  if (moves.length === 0) {
    return 'No moves'
  }

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
  process.stderr.write('setupOpponentStartingRegions:' + data + '\n')
}

function shuffle (arr) {
  for (
    var j, x, i = arr.length;
    i;
    j = parseInt(Math.random() * i, 10), x = arr[--i], arr[i] = arr[j], arr[j] = x
  ) {
    continue
  }

  return arr
}

function toCamelCase (input) {
  return input.replace('/', '_').replace(/_[a-z]/g, function replacer (match) {
    return match.toUpperCase().replace('_', '')
  })
}
