var assert = require('assert')
var through = require('through')
var createBot = require('../../bot')

/*eslint-disable max-len*/
var input = (
  'settings your_bot player2\n' +
  'settings opponent_bot player1\n' +
  'settings starting_armies 20\n' +
  'setup_map super_regions 1 4 2 4 3 3 4 3 5 3 6 4 7 3 8 3 9 4\n' +
  'setup_map regions 1 1 2 1 3 1 4 1 5 1 6 1 7 2 8 2 9 2 10 2 11 2 12 3 13 3 14 3 15 4 16 4 17 4 18 5 19 5 20 5 21 5 22 6 23 6 24 6 25 6 26 7 27 7 28 7 29 7 30 7 31 8 32 8 33 8 34 8 35 9 36 9 37 9 38 9 39 9 40 9\n' +
  'setup_map neighbors 1 3,16,15,2 2 3 3 6,16,5,4,7 4 7,8 5 9,10,6,7 6 10,18,16 7 8,13,9 8 13 9 10,11,13,14 10 28,27,26,11,19,18 11 14,31,28,29 12 13 13 14 14 31,22,23,32 15 16,17 16 18,17 17 18 18 19,21,26,20 20 21 21 35,26,37 22 23 23 25,32,24 24 31,34,33,32 26 27,35,28 27 28 28 29,30,36,35 29 31,30 30 33,31,38,36 31 32,33 33 34,38 35 36,37 36 37,38 37 39,40,38 38 40 39 40\n' +
  'update_map 13 player2 2 17 player2 2 18 player2 2 28 player2 2 7 neutral 2 8 neutral 2 12 neutral 2 14 neutral 2 9 neutral 2 15 neutral 2 16 neutral 2 6 neutral 2 19 neutral 2 21 neutral 2 26 neutral 2 20 neutral 2 10 neutral 6 11 neutral 2 27 neutral 2 29 neutral 2 30 neutral 2 36 neutral 2 35 neutral 2\n' +
  'go place_armies 10000\n' +
  'update_map 13 player2 2 17 player2 1 18 player2 3 19 player2 3 28 player2 3 7 neutral 2 8 neutral 2 12 neutral 2 14 neutral 2 9 neutral 2 15 neutral 2 16 neutral 2 6 neutral 2 21 neutral 2 26 neutral 2 20 neutral 2 10 neutral 6 11 neutral 2 27 neutral 2 29 neutral 2 30 neutral 2 36 neutral 2 35 neutral 2\n' +
  'go place_armies 10000\n' +
  'update_map 6 player2 2 13 player2 3 17 player2 1 18 player2 4 19 player2 1 28 player2 1 36 player2 3 3 neutral 2 5 neutral 2 10 neutral 6 16 neutral 2 7 player1 2 8 neutral 2 12 neutral 2 14 neutral 2 9 neutral 2 15 neutral 2 21 neutral 2 26 neutral 2 20 neutral 2 11 neutral 2 27 neutral 2 29 neutral 2 30 neutral 2 35 neutral 2 37 neutral 2 38 neutral 2\n' +
  'go place_armies 10000\n' +
  'update_map 6 player2 1 13 player2 2 17 player2 1 18 player2 2 19 player2 1 20 player2 2 28 player2 3 36 player2 1 3 neutral 2 5 neutral 2 10 neutral 6 16 neutral 2 7 player1 5 8 neutral 2 12 neutral 2 14 player1 2 9 neutral 2 15 neutral 2 21 neutral 2 26 neutral 2 11 neutral 2 27 neutral 2 29 neutral 2 30 neutral 2 35 neutral 2 37 neutral 2 38 player1 2\n' +
  'go place_armies 10000\n' +
  'update_map 6 player2 2 13 player2 1 17 player2 1 18 player2 2 19 player2 1 20 player2 1 28 player2 1 36 player2 3 37 player2 2 3 neutral 2 5 neutral 2 10 neutral 6 16 neutral 2 7 player1 5 8 neutral 2 12 neutral 1 14 player1 2 9 neutral 2 15 neutral 2 21 neutral 2 26 neutral 2 11 neutral 2 27 neutral 2 29 neutral 2 30 neutral 2 35 neutral 2 38 player1 4 39 neutral 2 40 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 6 player2 1 17 player2 1 18 player2 2 19 player2 2 20 player2 1 28 player2 1 30 player2 3 36 player2 1 37 player2 1 3 neutral 2 5 neutral 2 10 neutral 6 16 neutral 2 15 neutral 2 21 neutral 1 26 neutral 2 11 neutral 2 27 neutral 2 29 neutral 2 35 neutral 2 33 neutral 6 31 neutral 2 38 player1 3 39 neutral 2 40 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 6 player2 1 17 player2 1 18 player2 2 19 player2 1 20 player2 2 28 player2 1 30 player2 1 31 player2 1 36 player2 1 37 player2 3 3 neutral 2 5 player1 2 10 neutral 6 16 neutral 2 15 neutral 2 21 neutral 1 26 neutral 2 11 neutral 2 27 neutral 2 29 neutral 2 35 neutral 2 33 neutral 6 38 player1 7 14 player1 3 32 neutral 2 24 player1 1 39 neutral 2 40 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 6 player2 2 17 player2 1 18 player2 2 19 player2 1 20 player2 2 28 player2 1 31 player2 1 36 player2 2 37 player2 3 3 neutral 2 5 player1 4 10 neutral 6 16 neutral 2 15 neutral 2 21 neutral 1 26 neutral 2 11 neutral 2 27 neutral 2 29 neutral 2 30 player1 5 35 neutral 2 14 player1 4 32 neutral 2 33 neutral 6 24 player1 1 38 player1 2 39 neutral 2 40 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 6 player2 1 17 player2 2 18 player2 2 19 player2 1 20 player2 1 36 player2 3 37 player2 3 3 neutral 2 5 player1 5 10 neutral 6 16 neutral 2 15 neutral 2 21 neutral 1 26 neutral 2 28 player1 3 35 neutral 2 38 player1 2 30 player1 3 39 neutral 2 40 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 17 player2 2 18 player2 2 19 player2 1 20 player2 1 36 player2 1 37 player2 1 38 player2 2 40 player2 2 15 neutral 2 16 neutral 2 6 player1 3 21 neutral 1 26 neutral 2 10 neutral 6 28 player1 5 35 neutral 2 30 player1 4 39 neutral 2 33 neutral 6\n' +
  'go place_armies 10000\n' +
  'update_map 17 player2 1 18 player2 4 19 player2 1 20 player2 1 37 player2 2 38 player2 1 40 player2 1 15 neutral 2 16 neutral 2 6 player1 6 21 neutral 1 26 neutral 2 10 neutral 4 35 neutral 2 36 player1 3 39 neutral 2 30 player1 2 33 neutral 6\n' +
  'go place_armies 10000\n' +
  'update_map 16 player2 3 17 player2 1 18 player2 1 19 player2 1 20 player2 1 37 player2 3 38 player2 1 40 player2 1 1 neutral 2 3 player1 4 15 neutral 2 6 player1 4 21 neutral 1 26 neutral 2 10 neutral 3 35 neutral 2 36 player1 4 39 neutral 2 30 player1 2 33 neutral 6\n' +
  'go place_armies 10000\n' +
  'update_map 1 player2 2 16 player2 1 17 player2 1 19 player2 1 20 player2 1 37 player2 3 40 player2 1 3 player1 4 15 neutral 2 2 neutral 6 18 player1 2 6 player1 1 10 neutral 3 21 neutral 1 35 neutral 2 36 player1 3 39 neutral 2 38 player1 2\n' +
  'go place_armies 10000\n' +
  'update_map 1 player2 1 16 player2 2 17 player2 1 19 player2 1 20 player2 2 37 player2 3 40 player2 1 3 player1 5 15 neutral 2 2 neutral 6 18 player1 2 6 player1 1 10 neutral 3 21 neutral 1 35 neutral 2 36 player1 5 39 neutral 2 38 player1 3\n' +
  'go place_armies 10000\n' +
  'update_map 16 player2 3 17 player2 1 19 player2 1 20 player2 3 37 player2 3 1 player1 3 3 player1 4 15 neutral 2 18 player1 2 6 player1 1 10 neutral 3 21 neutral 1 35 player1 3 36 player1 3 39 neutral 2 40 player1 1 38 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 15 player2 2 16 player2 1 17 player2 2 19 player2 1 20 player2 1 21 player2 2 37 player2 3 1 player1 3 3 player1 7 18 player1 2 6 player1 1 10 neutral 3 35 player1 3 26 neutral 2 36 player1 3 39 neutral 2 40 player1 1 38 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 15 player2 3 17 player2 3 19 player2 2 20 player2 2 21 player2 3 37 player2 3 1 player1 2 16 player1 5 18 player1 2 10 neutral 3 35 player1 5 26 neutral 2 36 player1 3 39 neutral 2 40 player1 1 38 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 15 player2 1 17 player2 1 18 player2 2 19 player2 2 20 player2 3 21 player2 3 37 player2 3 1 player1 2 16 player1 8 6 player1 1 26 player1 3 10 neutral 3 35 player1 3 36 player1 3 39 neutral 2 40 player1 1 38 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 17 player2 2 18 player2 4 19 player2 1 20 player2 1 21 player2 6 37 player2 1 40 player2 3 15 player1 6 16 player1 6 6 player1 1 26 player1 3 10 neutral 3 35 player1 3 36 player1 3 39 neutral 2 38 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 18 player2 3 19 player2 1 20 player2 1 21 player2 1 26 player2 5 39 player2 3 40 player2 1 16 player1 2 17 player1 8 6 player1 1 10 neutral 3 35 player1 2 37 player1 1 27 neutral 2 28 player1 1 38 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 10 player2 3 19 player2 1 20 player2 1 21 player2 2 26 player2 1 37 player2 2 39 player2 1 40 player2 3 5 player1 1 6 player1 1 9 neutral 2 28 player1 1 27 neutral 2 11 neutral 2 18 player1 6 35 player1 6 36 player1 1 38 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 19 player2 2 20 player2 2 26 player2 1 27 player2 2 37 player2 2 39 player2 1 40 player2 3 18 player1 13 10 player1 4 21 player1 4 35 player1 1 28 player1 1 36 player1 1 38 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 26 player2 2 27 player2 1 37 player2 2 39 player2 1 40 player2 3 18 player1 9 10 player1 6 35 player1 1 28 player1 1 21 player1 1 36 player1 1 38 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 37 player2 2 39 player2 1 40 player2 3 21 player1 1 35 player1 1 36 player1 1 38 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 37 player2 2 39 player2 1 40 player2 3 21 player1 29 35 player1 1 36 player1 1 38 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 39 player2 1 40 player2 3 37 player1 27 38 player1 1\n' +
  'go place_armies 10000\n' +
  'update_map 40 player2 3 37 player1 23 38 player1 1 39 player1 25\n'
)
/*eslint-enable max-len*/

var allKnowns = setKnowns()
var lineCount = 0
var inputStream = through()

var bot = createBot(inputStream, through(function handleLine () {
  var knowns = allKnowns[lineCount]
  var map = bot.map.getRegions()
  for (var i = 0; i < map.length; i++) {
    var region = map[i]
    var owner = knowns[region.id]
    if (owner) {
      assert.equal(region.owner, owner)
    } else {
      assert.notEqual(region.owner, bot.options.your_bot)
    }
  }
  lineCount++
}))

inputStream.write(input)

process.on('exit', function handleExit () {
  assert.equal(
    lineCount,
    allKnowns.length - 1,
    'should have iterated through all knowns'
  )
})


function setKnowns () {
  return [
    {
      6: 'neutral',
      7: 'neutral',
      8: 'neutral',
      9: 'neutral',
      10: 'neutral',
      11: 'neutral',
      12: 'neutral',
      13: 'player2',
      14: 'neutral',
      15: 'neutral',
      16: 'neutral',
      17: 'player2',
      18: 'player2',
      19: 'neutral',
      20: 'neutral',
      21: 'neutral',
      26: 'neutral',
      27: 'neutral',
      28: 'player2',
      29: 'neutral',
      30: 'neutral',
      35: 'neutral',
      36: 'neutral'
    }, {
      6: 'neutral',
      7: 'neutral',
      8: 'neutral',
      9: 'neutral',
      10: 'neutral',
      11: 'neutral',
      12: 'neutral',
      13: 'player2',
      14: 'neutral',
      15: 'neutral',
      16: 'neutral',
      17: 'player2',
      18: 'player2',
      19: 'player2',
      20: 'neutral',
      21: 'neutral',
      26: 'neutral',
      27: 'neutral',
      28: 'player2',
      29: 'neutral',
      30: 'neutral',
      35: 'neutral',
      36: 'neutral'
    }, {
      3: 'neutral',
      5: 'neutral',
      6: 'player2',
      7: 'player1',
      8: 'neutral',
      9: 'neutral',
      10: 'neutral',
      11: 'neutral',
      12: 'neutral',
      13: 'player2',
      14: 'neutral',
      15: 'neutral',
      16: 'neutral',
      17: 'player2',
      18: 'player2',
      19: 'player2',
      20: 'neutral',
      21: 'neutral',
      26: 'neutral',
      27: 'neutral',
      28: 'player2',
      29: 'neutral',
      30: 'neutral',
      35: 'neutral',
      36: 'player2',
      37: 'neutral',
      38: 'neutral'
    }, {
      3: 'neutral',
      5: 'neutral',
      6: 'player2',
      7: 'player1',
      8: 'neutral',
      9: 'neutral',
      10: 'neutral',
      11: 'neutral',
      12: 'neutral',
      13: 'player2',
      14: 'player1',
      15: 'neutral',
      16: 'neutral',
      17: 'player2',
      18: 'player2',
      19: 'player2',
      20: 'player2',
      21: 'neutral',
      26: 'neutral',
      27: 'neutral',
      28: 'player2',
      29: 'neutral',
      30: 'neutral',
      35: 'neutral',
      36: 'player2',
      37: 'neutral',
      38: 'player1'
    }, {
      3: 'neutral',
      5: 'neutral',
      6: 'player2',
      7: 'player1',
      8: 'neutral',
      9: 'neutral',
      10: 'neutral',
      11: 'neutral',
      12: 'neutral',
      13: 'player2',
      14: 'player1',
      15: 'neutral',
      16: 'neutral',
      17: 'player2',
      18: 'player2',
      19: 'player2',
      20: 'player2',
      21: 'neutral',
      26: 'neutral',
      27: 'neutral',
      28: 'player2',
      29: 'neutral',
      30: 'neutral',
      35: 'neutral',
      36: 'player2',
      37: 'player2',
      38: 'player1',
      39: 'neutral',
      40: 'player1'
    }, {
      3: 'neutral',
      5: 'neutral',
      6: 'player2',
      10: 'neutral',
      11: 'neutral',
      15: 'neutral',
      16: 'neutral',
      17: 'player2',
      18: 'player2',
      19: 'player2',
      20: 'player2',
      21: 'neutral',
      26: 'neutral',
      27: 'neutral',
      28: 'player2',
      29: 'neutral',
      30: 'player2',
      31: 'neutral',
      33: 'neutral',
      35: 'neutral',
      36: 'player2',
      37: 'player2',
      38: 'player1',
      39: 'neutral',
      40: 'player1'
    }, {
      3: 'neutral',
      5: 'player1',
      6: 'player2',
      10: 'neutral',
      11: 'neutral',
      14: 'player1',
      15: 'neutral',
      16: 'neutral',
      17: 'player2',
      18: 'player2',
      19: 'player2',
      20: 'player2',
      21: 'neutral',
      24: 'player1',
      26: 'neutral',
      27: 'neutral',
      28: 'player2',
      29: 'neutral',
      30: 'player2',
      31: 'player2',
      32: 'neutral',
      33: 'neutral',
      35: 'neutral',
      36: 'player2',
      37: 'player2',
      38: 'player1',
      39: 'neutral',
      40: 'player1'
    }, {
      3: 'neutral',
      5: 'player1',
      6: 'player2',
      10: 'neutral',
      11: 'neutral',
      14: 'player1',
      15: 'neutral',
      16: 'neutral',
      17: 'player2',
      18: 'player2',
      19: 'player2',
      20: 'player2',
      21: 'neutral',
      24: 'player1',
      26: 'neutral',
      27: 'neutral',
      28: 'player2',
      29: 'neutral',
      30: 'player1',
      31: 'player2',
      32: 'neutral',
      33: 'neutral',
      35: 'neutral',
      36: 'player2',
      37: 'player2',
      38: 'player1',
      39: 'neutral',
      40: 'player1'
    }, {
      3: 'neutral',
      5: 'player1',
      6: 'player2',
      10: 'neutral',
      15: 'neutral',
      16: 'neutral',
      17: 'player2',
      18: 'player2',
      19: 'player2',
      20: 'player2',
      21: 'neutral',
      26: 'neutral',
      28: 'player1',
      30: 'player1',
      35: 'neutral',
      36: 'player2',
      37: 'player2',
      38: 'player1',
      39: 'neutral',
      40: 'player1'
    }, {
      6: 'player1',
      10: 'neutral',
      15: 'neutral',
      16: 'neutral',
      17: 'player2',
      18: 'player2',
      19: 'player2',
      20: 'player2',
      21: 'neutral',
      26: 'neutral',
      28: 'player1',
      30: 'player1',
      33: 'neutral',
      35: 'neutral',
      36: 'player2',
      37: 'player2',
      38: 'player2',
      39: 'neutral',
      40: 'player2'
    }, {
      6: 'player1',
      10: 'neutral',
      15: 'neutral',
      16: 'neutral',
      17: 'player2',
      18: 'player2',
      19: 'player2',
      20: 'player2',
      21: 'neutral',
      26: 'neutral',
      30: 'player1',
      33: 'neutral',
      35: 'neutral',
      36: 'player1',
      37: 'player2',
      38: 'player2',
      39: 'neutral',
      40: 'player2'
    }, {
      1: 'neutral',
      3: 'player1',
      6: 'player1',
      10: 'neutral',
      15: 'neutral',
      16: 'player2',
      17: 'player2',
      18: 'player2',
      19: 'player2',
      20: 'player2',
      21: 'neutral',
      26: 'neutral',
      30: 'player1',
      33: 'neutral',
      35: 'neutral',
      36: 'player1',
      37: 'player2',
      38: 'player2',
      39: 'neutral',
      40: 'player2'
    }, {
      1: 'player2',
      2: 'neutral',
      3: 'player1',
      6: 'player1',
      10: 'neutral',
      15: 'neutral',
      16: 'player2',
      17: 'player2',
      18: 'player1',
      19: 'player2',
      20: 'player2',
      21: 'neutral',
      35: 'neutral',
      36: 'player1',
      37: 'player2',
      38: 'player1',
      39: 'neutral',
      40: 'player2'
    }, {
      1: 'player2',
      2: 'neutral',
      3: 'player1',
      6: 'player1',
      10: 'neutral',
      15: 'neutral',
      16: 'player2',
      17: 'player2',
      18: 'player1',
      19: 'player2',
      20: 'player2',
      21: 'neutral',
      35: 'neutral',
      36: 'player1',
      37: 'player2',
      38: 'player1',
      39: 'neutral',
      40: 'player2'
    }, {
      1: 'player1',
      3: 'player1',
      6: 'player1',
      10: 'neutral',
      15: 'neutral',
      16: 'player2',
      17: 'player2',
      18: 'player1',
      19: 'player2',
      20: 'player2',
      21: 'neutral',
      35: 'player1',
      36: 'player1',
      37: 'player2',
      38: 'player1',
      39: 'neutral',
      40: 'player1'
    }, {
      1: 'player1',
      3: 'player1',
      6: 'player1',
      10: 'neutral',
      15: 'player2',
      16: 'player2',
      17: 'player2',
      18: 'player1',
      19: 'player2',
      20: 'player2',
      21: 'player2',
      26: 'neutral',
      35: 'player1',
      36: 'player1',
      37: 'player2',
      38: 'player1',
      39: 'neutral',
      40: 'player1'
    }, {
      1: 'player1',
      10: 'neutral',
      15: 'player2',
      16: 'player1',
      17: 'player2',
      18: 'player1',
      19: 'player2',
      20: 'player2',
      21: 'player2',
      26: 'neutral',
      35: 'player1',
      36: 'player1',
      37: 'player2',
      38: 'player1',
      39: 'neutral',
      40: 'player1'
    }, {
      1: 'player1',
      6: 'player1',
      10: 'neutral',
      15: 'player2',
      16: 'player1',
      17: 'player2',
      18: 'player2',
      19: 'player2',
      20: 'player2',
      21: 'player2',
      26: 'player1',
      35: 'player1',
      36: 'player1',
      37: 'player2',
      38: 'player1',
      39: 'neutral',
      40: 'player1'
    }, {
      6: 'player1',
      10: 'neutral',
      15: 'player1',
      16: 'player1',
      17: 'player2',
      18: 'player2',
      19: 'player2',
      20: 'player2',
      21: 'player2',
      26: 'player1',
      35: 'player1',
      36: 'player1',
      37: 'player2',
      38: 'player1',
      39: 'neutral',
      40: 'player2'
    }, {
      6: 'player1',
      10: 'neutral',
      16: 'player1',
      17: 'player1',
      18: 'player2',
      19: 'player2',
      20: 'player2',
      21: 'player2',
      26: 'player2',
      27: 'neutral',
      28: 'player1',
      35: 'player1',
      37: 'player1',
      38: 'player1',
      39: 'player2',
      40: 'player2'
    }, {
      5: 'player1',
      6: 'player1',
      9: 'neutral',
      10: 'player2',
      11: 'neutral',
      18: 'player1',
      19: 'player2',
      20: 'player2',
      21: 'player2',
      26: 'player2',
      27: 'neutral',
      28: 'player1',
      35: 'player1',
      36: 'player1',
      37: 'player2',
      38: 'player1',
      39: 'player2',
      40: 'player2'
    }, {
      18: 'player1',
      19: 'player2',
      20: 'player2',
      21: 'player1',
      26: 'player2',
      27: 'player2',
      28: 'player1',
      35: 'player1',
      36: 'player1',
      37: 'player2',
      38: 'player1',
      39: 'player2',
      40: 'player2'
    }, {
      10: 'player1',
      18: 'player1',
      21: 'player1',
      26: 'player2',
      27: 'player2',
      28: 'player1',
      35: 'player1',
      36: 'player1',
      37: 'player2',
      38: 'player1',
      39: 'player2',
      40: 'player2'
    }, {
      21: 'player1',
      35: 'player1',
      36: 'player1',
      37: 'player2',
      38: 'player1',
      39: 'player2',
      40: 'player2'
    }, {
      21: 'player1',
      35: 'player1',
      36: 'player1',
      37: 'player2',
      38: 'player1',
      39: 'player2',
      40: 'player2'
    }, {
      37: 'player1',
      38: 'player1',
      39: 'player2',
      40: 'player2'
    }, {
      37: 'player1',
      38: 'player1',
      39: 'player1',
      40: 'player2'
    }
  ]
}
