var assert = require('assert')
var through = require('through')
var createBot = require('../../bot')

/*eslint-disable max-len*/
var input = (
  'settings timebank 10000\n' +
  'settings time_per_move 500\n' +
  'settings max_rounds 60\n' +
  'settings your_bot player1\n' +
  'settings opponent_bot player2\n' +
  'setup_map super_regions 1 5 2 3 3 1 4 2 5 2\n' +
  'setup_map regions 1 1 2 1 3 1 4 1 5 1 6 1 7 1 8 2 9 2 10 2 11 2 12 3 13 3 14 4 15 4 16 4 17 5 18 5 19 5\n' +
  'setup_map neighbors 1 2 2 7,8,4 3 5,4,6 4 6,7 5 12,6 6 9,13,12,7,8 7 8 8 10,14,9 9 17,10,13,18,11 10 17,15,14 11 12,13,18 12 13 14 15 15 17,16 17 18 18 19\n' +
  'setup_map wastelands 11 19\n' +
  'settings starting_regions 1 9 13 14 18\n' +
  'settings starting_pick_amount 2\n'
)
/*eslint-enable max-len*/

var lineCount = 0
var inputStream = through()

var bot = createBot(inputStream, through(function handleLine () {
  lineCount++
}))

inputStream.write(input)

var picks = bot.rankRegions(['1', '9', '13', '14', '18'])
assert.deepEqual(picks, ['13', '14', '18', '1', '9'], 'best to worst')

process.on('exit', function handleExit () {
  assert.equal(lineCount, 0, 'should have no response')
})
