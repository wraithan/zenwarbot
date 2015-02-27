/**
 * SuperRegion class
 * Initializes with an id, the super region's bonus
 * and an empty list for regions located in the super region
 * @param int id
 * @param int worth
 */
function SuperRegion (id, bonus) {
  if (!(this instanceof SuperRegion)) {
    return new SuperRegion(arguments)
  }

  this.id = id
  this.bonus = bonus
  this.regions = {}
}

module.exports = SuperRegion
