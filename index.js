var Bot = require('./bot')

// __main__
if (require.main === module) {
  var bot = new Bot(process.stdin, process.stdout)
}
