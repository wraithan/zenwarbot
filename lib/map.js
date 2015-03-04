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
}
