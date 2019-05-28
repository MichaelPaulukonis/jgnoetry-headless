const program = require(`commander`)
const Util = require(`../../lib/util.js`)
const util = new Util({ statusVerbosity: 1 })
const Corpora = require(`common-corpus`)
const jgRunner = require(`../../lib/jgnoetryRunner.js`)

let config = {}

const dump = (obj) => console.log(JSON.stringify(obj, null, 2))
const texts = new Corpora().texts
let corpus = texts
var corporaFilter = function (filter) {
  return function (corpus) {
    var r = new RegExp(filter, `i`)
    return corpus.filter(m => m.name.match(r) !== null)
  }
}

program
  .version(`0.0.1`)
  .option(`-t, --templateName [jgnoetry template name]`, `specify jgnoetry template to use`)
  .option(`-c, --corporaFilter [string]`, `filename substring filter (non-case sensitive)`)
  .option(`--debug-program`, `dumpt the program object and exit`)
  .parse(process.argv)

if (program.debugProgram) {
  dump(program)
  console.log(process.env)
  process.exit()
}

if (program.templateName) {
  config.templateName = program.templateName
}

if (program.corporaFilter) {
  corpus = corporaFilter(program.corporaFilter)(texts)
}

// corpora.texts = reduceCorpora(corpora.texts);
// corpora.weights = assignWeights(corpora.texts.length);
// const templateName = util.pick(Object.keys(templates));
// options.capitalize = assignCapitalization();
// options.appendToPoem = util.pick(endPuncts);

const keepWord = 'Specification'
config.existingText = [{ text: keepWord, keep: true }, { keep: false }, { keep: false }, { text: 'Barleycord', keep: true }]

const pome = jgRunner({ config, util, texts: corpus })

dump(pome)
