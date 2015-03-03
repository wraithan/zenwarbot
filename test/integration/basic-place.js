var assert = require('assert')
var through = require('through')
var bot = require('../../bot')

var input = (
  'settings timebank 10000\n' +
  'settings time_per_move 500\n' +
  'settings max_rounds 60\n' +
  'settings your_bot player1\n' +
  'settings opponent_bot player2\n' +
  'setup_map super_regions 1 5 2 5\n' +
  'setup_map regions 1 1 2 1 3 2 4 2\n' +
  'setup_map neighbors 1 2 2 3 3 4\n' +
  'settings starting_pick_amount 1\n' +
  'update_map 1 player1 2 2 player1 2 3 player2 2 4 player2\n' +
  'settings starting_armies 5\n' +
  'go place_armies 10000\n'
)

var lineCount = 0
var inputStream = through()

bot(inputStream, through(function handleLine (line) {
  lineCount++
  assert.strictEqual(
    line,
    'player1 place_armies 2 4, player1 place_armies 1 1\n',
    'should place most troops next to the enemy'
  )
}))

inputStream.write(input)

process.on('exit', function handleExit () {
  assert.equal(lineCount, 1, 'should only be 1 response')
})
