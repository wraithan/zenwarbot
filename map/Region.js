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

Region.prototype.anyNeighbors = function anyNeighbors(opponent) {
  var found = false
  for (var n in this.neighbors) {
    if (n.owner === opponent) {
      found = true
      break
    }
  }
  return found
}

module.exports = Region
