var assert = require('assert')
var through = require('through')
var bot = require('../../bot')

var input = (
  'settings timebank 10000\n' +
  'settings time_per_move 500\n' +
  'settings max_rounds 60\n' +
  'settings your_bot player1\n' +
  'settings opponent_bot player2\n' +
  'setup_map super_regions 1 5 2 5 3 4 4 0\n' +
  'setup_map regions 1 1 2 1 3 1 4 1 5 1 6 2 7 2 8 2 9 2 10 2 11 2 12 3 13 3 ' +
  '14 3 15 3 16 3 17 3 18 4 19 4\n' +
  'setup_map neighbors 1 6,2,9 2 4,9,11,3 3 4,5 4 5,11,19,18 5 19 6 7,9,10,' +
  '11 7 8,10 8 10,11,12,14 9 11 10 11 11 15,18,14 12 13,14 13 14 14 17,15,16 ' +
  '15 16,18 16 17,18 18 19\n' +
  'setup_map wastelands 3 17\n' +
  'settings starting_regions 5 9 12 18\n' +
  'settings starting_pick_amount 2\n' +
  'pick_starting_region 10000 5 9 12 18\n'
)

var CHOICES = [5, 9, 12, 18]
var lineCount = 0
var inputStream = through()

bot(inputStream, through(function handleLine (line) {
  lineCount++
  assert.strictEqual(
    line[line.length - 1],
    '\n',
    'response should end with newline'
  )
  var reply = parseInt(line.trim(), 10)
  assert.strictEqual(isNaN(reply), false, 'response should parse to a number')
  assert.ok(CHOICES.indexOf(reply) !== -1, 'response should be in choices')
}))

inputStream.write(input)

process.on('exit', function handleExit () {
  assert.equal(lineCount, 1, 'should only be 1 response')
})
