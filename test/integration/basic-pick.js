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
  'setup_map wastelands 1\n' +
  'settings starting_regions 2 3\n' +
  'settings starting_pick_amount 1\n' +
  'pick_starting_region 10000 2 3\n'
)

var lineCount = 0
var inputStream = through()

bot(inputStream, through(function handleLine (line) {
  lineCount++
  assert.strictEqual(
    line,
    '3\n',
    'should pick the superRegion without a wasteland'
  )
}))

inputStream.write(input)

process.on('exit', function handleExit () {
  assert.equal(lineCount, 1, 'should only be 1 response')
})
