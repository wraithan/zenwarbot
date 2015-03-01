var PossibleOwners = require('./PossibleOwners.js')

/**
 * Region class
 * Initializes with an id and a reference to the super region
 * @param int id
 * @param SuperRegion superRegion
 */
function Region (id, superRegion) {
  if (!( this instanceof Region)) {
    return new Region(arguments)
  }

  this.id = id
  this.superRegion = superRegion
  this.owner = PossibleOwners.NEUTRAL
  this.neighbors = []
  this.troopCount = 2
  this.isOnSuperRegionBorder = false
}

Region.prototype.anyNeighbors = function anyNeighbors(type) {
  var found = false
  var neighbor
  for (var i = 0; i < this.neighbors.length; ++i) {
    neighbor = this.neighbors[i]
    if (neighbor.owner === type) {
      found = true
      break
    }
  }
  return found
}

Region.prototype.filterNeighbors = function filterNeighbors(type) {
  var result = []
  var neighbor
  for (var i = 0; i < this.neighbors.length; ++i) {
    neighbor = this.neighbors[i]
    if (neighbor.owner === type) {
      result.push(neighbor)
    }
  }
  return result
}

module.exports = Region
