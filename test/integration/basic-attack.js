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
  'setup_map regions 1 1 2 2\n' +
  'setup_map neighbors 1 2\n' +
  'update_map 1 player1 4 2 player2 2\n' +
  'go attack/transfer 10000\n'
)
var lineCount = 0
var inputStream = through()

bot(inputStream, through(function handleLine (line) {
  lineCount++
  assert.equal(line, 'player1 attack/transfer 1 2 3\n')
}))

inputStream.write(input)

process.on('exit', function handleExit () {
  assert.equal(lineCount, 1, 'should only be 1 response')
})
