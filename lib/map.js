var players = require('./players.js')

module.exports = createMap

function createMap () {
  return new GameMap()
}

function GameMap () {
  this.regions = []
  this.regionsById = {}
  this.superRegions = []
  this.superRegionsById = {}
}

GameMap.prototype.onEnemyBorder = function onEnemyBorder () {
  var result = []
  for (var i = 0; i < this.regions.length; ++i) {
    var region = this.regions[i]
    if (region.owner === players.us && region.bordersEnemy()) {
      result.push(region)
    }
  }
  return result
}

GameMap.prototype.notOnEnemyBorder = function notOnEnemyBorder () {
  var result = []
  for (var i = 0; i < this.regions.length; ++i) {
    var region = this.regions[i]
    if (region.owner === players.us && !region.bordersEnemy()) {
      result.push(region)
    }
  }
  return result
}

GameMap.prototype.addSuperRegion = function addSuperRegion (id, bonus) {
  var superRegion = new SuperRegion(id, bonus)
  this.superRegions.push(superRegion)
  this.superRegionsById[id] = superRegion
  return superRegion
}

GameMap.prototype.addRegion = function addRegion (id, superRegionId) {
  var superRegion = this.superRegionsById[superRegionId]
  var region = new Region(id, superRegion)
  this.regions.push(region)
  this.regionsById[id] = region
  superRegion.regions.push(region)
  superRegion.regionsById[id] = region
  return region
}

GameMap.prototype.addNeighbors = function addNeighbors (regionId, neighboringIds) {
  var region = this.regionsById[regionId]
  for (var i = 0; i < neighboringIds.length; ++i) {
    var neighbor = this.regionsById[neighboringIds[i]]
    region.neighbors.push(neighbor)
    region.neighborsById[neighbor.id] = neighbor
    neighbor.neighbors.push(region)
    neighbor.neighborsById[regionId] = region
  }
}

GameMap.prototype.addWastelands = function addWastelands (ids) {
  for (var i = 0; i < ids.length; ++i) {
    var region = this.regionsById[ids[i]]
    region.troopCount = 6
    region.superRegion.wastelandCount++
  }
}

GameMap.prototype.handleUpdate = function handleUpdate (data) {
  var region
  var handled = []
  for (var i = 0; i < data.length; i += 3) {
    var regionId = parseInt(data[i], 10)
    region = this.regionsById[regionId]
    region.owner = data[i + 1]
    region.troopCount = parseInt(data[i + 2], 10)
    handled.push(regionId)
  }
  for (var j = 0; j < this.regions.length; ++j) {
    region = this.regions[j]
    region.cache = {}
    if (handled.indexOf(region.id) === -1 && region.owner === players.us) {
      region.owner = players.them
    }
  }
}

function SuperRegion (id, bonus) {
  this.id = id
  this.bonus = bonus
  this.regions = []
  this.regionsById = {}
  this.wastelandCount = 0
}

function Region (id, superRegion) {
  this.id = id
  this.superRegion = superRegion
  this.owner = players.neutral
  this.troopCount = 2
  this.neighbors = []
  this.neighborsById = {}
  this.cache = {}
}

Region.prototype.bordersEnemy = function bordersEnemy () {
  return this.getNeighboringEnemies().length > 0
}

Region.prototype.bordersNeutral = function bordersNeutral () {
  return this.getNeighboringNeutrals().length > 0
}

Region.prototype.averageNeutralSRBonus = function averageNeutralSRBonus () {
  var neutralNeighbors = this.getNeighboringNeutrals()
  var total = 0
  for (var i = 0; i < neutralNeighbors.length; ++i) {
    total += neutralNeighbors[i].superRegion.bonus
  }
  return total / neutralNeighbors.length
}

Region.prototype.getNeighboringEnemies = function getNeighboringEnemies () {
  if (this.cache.enemies === undefined) {
    this.cache.enemies = []
    for (var i = 0; i < this.neighbors.length; ++i) {
      var region = this.neighbors[i]
      if (region.owner === players.them) {
        this.cache.enemies.push(region)
      }
    }
  }

  return this.cache.enemies.slice()
}

Region.prototype.getNeighboringAllies = function getNeighboringAllies () {
  if (this.cache.allies === undefined) {
    this.cache.allies = []
    for (var i = 0; i < this.neighbors.length; ++i) {
      var region = this.neighbors[i]
      if (region.owner === players.us) {
        this.cache.allies.push(region)
      }
    }
  }

  return this.cache.allies.slice()
}

Region.prototype.getNeighboringNeutrals = function getNeighboringNeutrals () {
  if (this.cache.neutrals === undefined) {
    this.cache.neutrals = []
    for (var i = 0; i < this.neighbors.length; ++i) {
      var region = this.neighbors[i]
      if (region.owner === players.neutral) {
        this.cache.neutrals.push(region)
      }
    }
  }

  return this.cache.neutrals.slice()
}
