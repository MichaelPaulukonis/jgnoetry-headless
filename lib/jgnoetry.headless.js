/*
 jGnoetry.headless - Michael Paulukonis 2012-2016

 Based very heavily on code originally Copyright 2011 Edde Addad
 Based on Gnoetry by Jon Trowbridge and Eric Elshtain

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const { cleanTemplateArray, countSyllables } = require('./templating')

const JGnoetry = function (util) {
  if (!(this instanceof JGnoetry)) {
    return new JGnoetry(util)
  }

  let debug = util.debug || function (msg) {
    console.log(msg) // eslint-disable-line no-console
  }

  this.generate = function (templateText, options, corpora, existingText) {
    debug(`Options: \n  punctuation handling is: ` + options.handlePunctuation, 1)
    debug(`  starting lines by: ` + options.byNewlineOrPunctuation, 1)

    // get the template text, make an array out of it
    var templateArr = cleanTemplateArray(templateText, false)
    debug(`\nTemplate Text is: \n` + templateText, 1)

    debug(`Generating Array of Words...`, 1)

    // TODO: rename all of this, and come up with a structure to pass in/back data?
    // becuase.... we could build tInfo EXTERNAL to this.generate and reduce the ugly param-list.....
    var { generatedWordsArr, generatedWordsStaticArr } = processTemplate(templateArr, corpora, options, existingText)

    // print out the generated words array
    debug(`\nGenerated Words:`, 1)
    debug(generatedWordsArr.map((w, index) => `Word ${index}: ${w}`).join('\n'), 1)

    // print out the static words array
    debug(`\nStatic Generated Words:`, 1)
    debug(generatedWordsStaticArr.map((w, index) => `Word  Static` + index + `: ` + w).join('\n'), 1)

    // TODO: better structure to pass in
    // TODO: OMG the parameter list!
    const gnoe = getOutput(templateArr, generatedWordsArr, generatedWordsStaticArr, corpora, options)

    return {
      displayText: editStringPunctuationOutput(gnoe.outputString),
      displayEditor: gnoe.editorString,
      template: templateText
    }
  }

  function templateLoop (template, debug, syllableBalance, wordIndex, generatedWords, getAWord, corpora, generatedWordsKeep, options, isFollowingPunctuation, isFollowingNewline, outputString, editorString, isEndPunctuation, isPunctuation) {
    template.forEach(templateToken => {
      debug(`Template Token: ${templateToken}`, 1)
      if (templateToken === '[s]') {
        syllableBalance--
        // accept generated words to change syllable balance
        // make a loop count in case only punctuation being generated - don't hang browser
        var loopCount = 0
        while (syllableBalance < 0 && loopCount < 5) {
          // advance wordIndex, identify word there
          // make sure there is a word there, if not, generate one
          wordIndex++
          var tempWord = ``
          if (generatedWords[wordIndex] != null) {
            tempWord = generatedWords[wordIndex]
          } else {
            var w = wordIndex - 1
            tempWord = getAWord(generatedWords[w].toLowerCase(), corpora)
            generatedWords.push(tempWord.toLowerCase())
            generatedWordsKeep.push(false)
          }
          // find how many syllables that word has
          var tempWordSyllCount = countSyllables(tempWord)
          // re-calculate syllable balance
          syllableBalance += tempWordSyllCount
          loopCount++
          debug(`    After adding word: ` + tempWord + `, Syllable Balance is ` + syllableBalance, 2)
          // add word for printout and editor buffers
          var wordToPrint = tempWord.trim()
          // if capitalizing first words in sentence, capitalize
          if (options.capitalize.customSentence === true && isFollowingPunctuation === true) {
            wordToPrint = wordToPrint.charAt(0).toUpperCase() + wordToPrint.substring(1)
          }
          // if capitalizing first words after a newline, capitalize
          if (options.capitalize.customLine === true && isFollowingNewline === true) {
            wordToPrint = wordToPrint.charAt(0).toUpperCase() + wordToPrint.substring(1)
          }
          // if capitalizing 'I', capitalize the word to print
          if (options.capitalize.customI === true) {
            if (wordToPrint === `i` || wordToPrint === `i'll` || wordToPrint === `i'm` || wordToPrint === `i'd` || wordToPrint === `i've`) {
              wordToPrint = wordToPrint.replace(`i`, `I`)
            }
          }
          outputString = outputString + ` ` + wordToPrint
          if (generatedWordsKeep[wordIndex] === false) {
            options.thisWordSelectedBegin = `startSelected`
          } else if (generatedWordsKeep[wordIndex] === true) {
            options.thisWordSelectedBegin = `startNotSelected`
          }
          // TODO: return something that the GUI plays around with
          // appendButton defined in gui.js
          // editorString = appendButton(editorString, wordToPrint, wordIndex, options.areWordsSelectedBegin, options.thisWordSelectedBegin, options.changeSelectionEffect);
          // TODO: this isn't even used. SIGH
          // so, let's figure out how to ditch unused stuff
          // AND pass in pre-made text with... some stuff..
          editorString = wordToPrint
          // see if next word will be following punctuation
          isFollowingPunctuation = isEndPunctuation(tempWord)
          isFollowingNewline = false
        }
      } else if (templateToken === `[n]`) {
        // make sure the next line doesn't start with punctuation
        var nextWord = generatedWords[wordIndex + 1]
        if (isPunctuation(nextWord)) {
          wordIndex++
          // make sure generated words array is long enough
          if (generatedWords[wordIndex] != null) {
            wordToPrint = generatedWords[wordIndex]
          } else {
            var v = wordIndex - 1
            wordToPrint = getAWord(generatedWords[v].toLowerCase(), corpora)
            generatedWords.push(tempWord.toLowerCase())
            generatedWordsKeep.push(false)
          }
          outputString = outputString + ` ` + wordToPrint
          if (generatedWordsKeep[wordIndex] === false) {
            options.thisWordSelectedBegin = `startSelected`
          } else if (generatedWordsKeep[wordIndex] === true) {
            options.thisWordSelectedBegin = `startNotSelected`
          }
          // appendButton defined in gui.js
          // editorString = appendButton(editorString, wordToPrint, wordIndex, options.areWordsSelectedBegin, options.thisWordSelectedBegin, options.changeSelectionEffect);
          editorString = wordToPrint
          isFollowingNewline = true
        }
        outputString += `\n`
        editorString += `\n\n`
        isFollowingNewline = true
        syllableBalance = 0
        debug(`    Syllable Balance is ` + syllableBalance, 2)
      } else {
        outputString = outputString + ` ` + templateToken
        generatedWords.push(templateToken.toLowerCase())
        // see if next word will be following punctuation
        isFollowingPunctuation = isEndPunctuation(templateToken)
        isFollowingNewline = false
        // generatedWords[wordIndex]
        // figure out what triggers subsequent capitalization
      }
      // TODO: if there are existing words in the template, this would _almost_ be where to process them
      // EXCEPT words in the template are essentially EXISTING TEXT
      // so we should push that template through there, somehow? or... I dunno. something.
    })

    return { syllableBalance, wordIndex, isFollowingPunctuation, isFollowingNewline, outputString, editorString }
  }

  // THIS IS WHERE THE MAGIC HAPPENS
  // this mashes the markov-words into the template, as needed, if they match syllables
  var getOutput = function (template, generatedWords, generatedWordsKeep, corpora, options) {
    // number of syllables counted in generated words accepted so far, minus syllables counted in template
    var syllableBalance = 0

    // output in terms of final text, and html editor
    var outputString = ``
    var editorString = ``

    // whether the previous token was a punctuation or newline mark
    // (the poem begins with an assumed punctuation and newline)
    var isFollowingPunctuation = true
    var isFollowingNewline = true

    // index of array in generated words, representing words accepted so far
    var wordIndex = -1

    // FIT THE ARRAY OF WORDS TO THE TEMPLATE
    var wordToPrint;
    ({ syllableBalance, wordIndex, isFollowingPunctuation, isFollowingNewline, outputString, editorString } = templateLoop(template, debug, syllableBalance, wordIndex, generatedWords, getAWord, corpora, generatedWordsKeep, options, isFollowingPunctuation, isFollowingNewline, outputString, editorString, isEndPunctuation, isPunctuation))

    // * * * * * * * * * * * * * * * *
    // PRODUCE OUTPUT

    if (options.appendToPoem !== `appendNothing` && !isFollowingPunctuation) {
      wordIndex++
      wordToPrint = ``
      if (options.appendToPoem === `appendPeriod`) {
        wordToPrint = `.`
      } else if (options.appendToPoem === `appendQuestion`) {
        wordToPrint = `?`
      } else if (options.appendToPoem === `appendExclamation`) {
        wordToPrint = `!`
      }

      outputString = outputString + ` ` + wordToPrint

      if (generatedWordsKeep[wordIndex] === false) {
        options.thisWordSelectedBegin = `startSelected`
      } else if (generatedWordsKeep[wordIndex] === true) {
        options.thisWordSelectedBegin = `startNotSelected`
      }

      // appendButton defined in gui.js
      // TODO: return something to the gui
      // and then the gui decides what to do THERE
      // not here. eff the GUI
      // editorString = appendButton(editorString, wordToPrint, wordIndex,
      //                             options.areWordsSelectedBegin, options.thisWordSelectedBegin, options.changeSelectionEffect);
      editorString = wordToPrint
    }

    debug(``, 1)
    debug(`editor output is: ` + editorString, 1)

    var gnoe = {
      outputString: outputString,
      editorString: editorString
    }

    return gnoe
  }

  // * * * * * * * * * * * * * * * *
  // CHAINED N-GRAM FUNCTIONS

  var makeWordsArray = function (numberOfWords, byNewlineOrPunctuation, corpora) {
    // the array that will be returned
    var toReturn = []

    // the n-gram history
    var history = ` `

    // whether it is the first word in a sentence
    var isFirstWord = true

    for (var i = 0; i < numberOfWords; i++) {
      debug(` `, 2)
      debug(`Generating Word number: ` + i + `: `, 2)

      if (isFirstWord === true) {
        debug(`  is a first word`, 2)
        debug(`  finding a word`, 2)
        debug(`  - - -`, 2)

        history = getAFirstWord(byNewlineOrPunctuation, corpora)

        debug(`  - - -`, 2)
        debug(`  found a word: ` + history, 2)

        isFirstWord = false

        // add to output array
        toReturn.push(history)
      } else {
        debug(`  is not a first word`, 2)
        debug(`  finding a word`, 2)
        debug(`  - - -`, 2)

        history = getAWord(history, corpora)

        // add to output array
        toReturn.push(history)

        debug(`  - - -`, 2)
        debug(`  found a word: ` + history, 2)
      }
    }

    return toReturn
  }

  // get the first word of a sentence being generated
  var getAFirstWord = function (byNewlineOrPunctuation, corpora) {
    // identify the corpus to use
    var corpusText = ``
    // generate a random number from 1 to 100 (since weights are a percentage)
    var randomWeight = Math.floor(util.random() * 100)
    // for each text, get its weight, subtract it from the random number
    // if the total is 0 or less, use that text
    for (var i = 0; i < corpora.texts.length; i++) {
      debug(`  randomWeight is: ` + randomWeight + ` and corpora.weights[` + i + `] is: ` + corpora.weights[i], 2)
      randomWeight = randomWeight - corpora.weights[i]
      if (randomWeight <= 0) {
        corpusText = corpora.texts[i]
        debug(`  decided on corpus ` + i, 2)
        break
      }
    }

    // find a random location in the corpusText string
    var randomIndex = Math.floor(util.random() * corpusText.length)

    // if we are finding by punctuation
    if (byNewlineOrPunctuation !== `newline`) {
      // if is byPunctuation - identify the first punctuation after the random location
      var punctuationFound = findFollowingPunctuation(corpusText, randomIndex)

      if (punctuationFound !== ``) {
        debug(`  closest punctuation found is: ` + punctuationFound, 2)
        // find the first word after the punctuation
        return findFollowingWord(corpusText, punctuationFound, randomIndex)
      }
      debug(`  not found a punctuation`, 2)
    }

    // if we get to this point, we are finding by newline
    // either by choice or because corpus has no punctuation
    debug(`  finding line following newline`, 2)
    return findFollowingWord(corpusText, `\n`, randomIndex)
  }

  // not currently used - think this will be part of template expansion
  var hasNonTemplateWord = function (aTemplateText) { // eslint-disable-line no-unused-vars
    for (var i = 0; i < aTemplateText.length; i++) {
      if (aTemplateText[i] !== `[s]` && aTemplateText[i] !== `[n]`) {
        return true
      }
    }

    return false
  }

  // whether a given word is an end punctuation or not
  var isEndPunctuation = function (word) {
    if (word === `.` || word === `?` || word === `!`) {
      return true
    }
    return false
  }

  // whether a given word is an end punctuation or not
  var isPunctuation = function (word) {
    if (word === `.` || word === `?` || word === `!` || word === `,` || word === `:` || word === `;` || word === `--` || word === `'`) { // '
      return true
    }
    return false
  }

  // from the starting index to the end of the corpus text, find the nearest punctuation
  // returns '' if nothing found
  var findFollowingPunctuation = function (corpusText, startingIndex) {
    var punctuationFound = ``
    var nextPunctuationIndex = -1
    var n
    var punctuation = [`.`, `?`, `!`]

    // look through the punctuations, identifying which comes next
    for (var x in punctuation) {
      n = corpusText.indexOf(punctuation[x], startingIndex)
      debug(`    index of ` + punctuation[x] + ` is ` + n, 2)

      // if the punctuation is found... (and it's not the last character)
      if (n !== -1 && n !== corpusText.length - 2) {
        // if a 'lowest index so far' has been found, and n is lower than it
        // then set the 'lowest index so far' to n
        // if 'lowest index so far' has not yet been found, set it to n
        if (nextPunctuationIndex !== -1 && n < nextPunctuationIndex) {
          nextPunctuationIndex = n
          punctuationFound = corpusText.charAt(nextPunctuationIndex)
        } else if (nextPunctuationIndex === -1) {
          nextPunctuationIndex = n
          punctuationFound = corpusText.charAt(nextPunctuationIndex)
        }
      }
      debug(`    corpusText.length is: ` + corpusText.length, 2)
      debug(`    nextPunctuationIndex is: ` + n, 2)
      debug(`    punctuationFound is: ` + punctuationFound, 2)
    }

    // if nothing found, look from beginning of text
    if (nextPunctuationIndex === -1) {
      // look through the punctuations, identifying which comes next
      for (x in punctuation) {
        n = corpusText.indexOf(punctuation[x])
        debug(`    index of ` + punctuation[x] + ` is ` + n, 2)

        // if the punctuation is found...
        // if ( n != -1 ) {
        // if the punctuation is found... (and it's not the last character)
        if (n !== -1 && n !== corpusText.length - 2) {
          // if a 'lowest index so far' has been found, and n is lower than it
          // then set the 'lowest index so far' to n
          // if 'lowest index so far' has not yet been found, set it to n
          if (nextPunctuationIndex !== -1 && n < nextPunctuationIndex) {
            nextPunctuationIndex = n
            punctuationFound = corpusText.charAt(nextPunctuationIndex)
          } else if (nextPunctuationIndex === -1) {
            nextPunctuationIndex = n
            punctuationFound = corpusText.charAt(nextPunctuationIndex)
          }
        }
        debug(`    nextPunctuationIndex is: ` + n, 2)
        debug(`    punctuationFound is: ` + punctuationFound, 2)
      }
    }

    return punctuationFound
  }

  // given a corpusText string and a previous word,
  // find the next word
  var getAWord = function (history, corpora) {
    // identify the corpus to use
    var corpusText = ``

    // generate a random number from 1 to 100 (since weights are a percentage)
    // TODO: replace with optional external rnd generator
    var randomWeight = Math.floor(util.random() * 100)
    // for each text, get its weight, subtract it from the random number
    // if the total is 0 or less, use that text
    for (var i = 0; i < corpora.texts.length; i++) {
      debug(`  randomWeight is: ` + randomWeight + ` and corpora.weights[` + i + `] is: ` + corpora.weights[i], 2)
      randomWeight = randomWeight - corpora.weights[i]
      if (randomWeight <= 0) {
        corpusText = corpora.texts[i]
        debug(`  decided on corpus ` + i, 2)
        break
      }
    }

    // for the first word, find a random location in the corpusText string
    var randomIndex = Math.floor(util.random() * corpusText.length)

    debug(`  randomIndex is: ` + randomIndex, 2)
    debug(`  character in context: ` + getCharacterInContext(corpusText, randomIndex), 2)

    // find the next word after it given the history
    return findFollowingWord(corpusText, history, randomIndex)
  }

  // given a corpusText and an index in it, find the next word
  // (may have to start looking at the beginning)
  var findFollowingWord = function (corpusText, history, startingIndex) {
    // var will be the index of the first character after the history

    // add surrounding spaces so you don't find substrings (ex: 'her' in 'where')
    // remember: modified corpus has spaces around most punctuation
    // TO DO: (can probably remove conditional after implemeting getAFirstWord)
    if (history !== ` `) {
      history = ` ` + history + ` `
    }

    // if you do not find a new word?  (corpus difference, static word, last word in corpus)
    // first, make sure the history word is actually in the corpus
    // if not, set the history word to ' '
    if (corpusText.indexOf(history) === -1) {
      debug(`  history ` + history + ` not found in corpus, setting to blank`, 2)
      history = ` `
    }

    // Find the first non-space character after the history

    // look for the index that starts the history
    var indexOfHistory = corpusText.indexOf(history, startingIndex)

    // if you haven't found the history text by the end of the corpus,
    // look from the beginning
    if (indexOfHistory === -1) {
      indexOfHistory = corpusText.indexOf(history)
    }

    // identify the first character after the history
    var indexAfterHistory = indexOfHistory + history.length

    // advance past spaces and newlines that might be after the history
    // (due to corpus text editing, there will not be more than ' \n ' )
    if (corpusText.charAt(indexAfterHistory) === ` `) {
      indexAfterHistory++
    }
    if (corpusText.charAt(indexAfterHistory) === `\n`) {
      indexAfterHistory++
    }
    if (corpusText.charAt(indexAfterHistory) === ` `) {
      indexAfterHistory++
    }
    debug(`  first non-space index after history is: ` + indexAfterHistory, 2)
    debug(`  character in context: ` + getCharacterInContext(corpusText, indexAfterHistory), 2)

    // find the first space after the end of the history
    // (i.e. the space-delimited token following the history text)
    var firstSpaceAfterHistory = corpusText.indexOf(` `, indexAfterHistory)

    // if the history is the last token in the text, search from the beginning.
    if (firstSpaceAfterHistory === -1) {
      indexOfHistory = corpusText.indexOf(history)
      indexAfterHistory = indexOfHistory + history.length
      // advance past spaces and newlines that might be after the history
      if (corpusText.charAt(indexAfterHistory) === ` `) {
        indexAfterHistory++
      }
      if (corpusText.charAt(indexAfterHistory) === `\n`) {
        indexAfterHistory++
      }
      if (corpusText.charAt(indexAfterHistory) === ` `) {
        indexAfterHistory++
      }
      debug(`  RECALCULATED first non-space index after history is: ` + indexAfterHistory, 2)
      debug(`  character in context: ` + getCharacterInContext(corpusText, indexAfterHistory), 2)
      firstSpaceAfterHistory = corpusText.indexOf(` `, indexAfterHistory)
    }

    debug(`  first space after history is: ` + firstSpaceAfterHistory, 2)
    debug(`  character in context: ` + getCharacterInContext(corpusText, firstSpaceAfterHistory), 2)

    // if the history is the last token in the text, and the last token is unique, report failure
    if (firstSpaceAfterHistory === -1) {
      return ``
    }

    // find the first word after the history
    var firstWordAfterHistory = corpusText.substring(indexAfterHistory, firstSpaceAfterHistory)
    debug(`  first word after history is: ` + firstWordAfterHistory + `\n`, 2)

    // TODO: make this configurable option
    // plus: other cleanup
    if (true) { // eslint-disable-line no-constant-condition
      firstWordAfterHistory = firstWordAfterHistory.replace(/\n/g, ` `)
    }

    return firstWordAfterHistory
  }

  // * * * * * * * * * * * * * * * *
  // STRING EDITING FUNCTIONS

  // remove spaces before in-sentence punctuation such as : and , and .
  var editStringPunctuationOutput = function (inputText) {
    // place spaces at beginning and end of corpus
    // TODO: WHY?!?!?
    // inputText = ' ' + inputText + ' ';

    // place spaces around certain punctuation (but not dashes and apostrophes)
    inputText = inputText.replace(/ ,/g, `,`)
      .replace(/ \./g, `.`)
      .replace(/ \?/g, `? `)
      .replace(/ !/g, `! `)
      .replace(/ ;/g, `; `)
      .replace(/ :/g, `: `)
      .replace(/\t/g, ` `)
      .replace(/ {2,}/g, ` `)

    return inputText
  }

  // replace newlines with characters
  var replaceNewlines = function (aString) {
    return aString.replace(/[\n\r]/g, `\\n`)
  }

  // given a text string and and index in it, get several characters to either side of it
  // (for debugging purposes)
  const getCharacterInContext = (aString, anIndex) => {
    var tempString = ``
    var returnString = ``

    tempString = aString.substring(anIndex - 8, anIndex)
    returnString += replaceNewlines(tempString)

    returnString += `|` + replaceNewlines(aString.charAt(anIndex)) + `|`

    tempString = aString.substring(anIndex + 1, anIndex + 9)
    returnString += replaceNewlines(tempString)
    // returnString += '\n';

    return returnString
  }

  // TODO: if non-tokens exist in template, they should be considered EXISTINGTEXT
  // So, really, the template should be pre-processed to create existingText
  // on subsequent passes, it will be pre-populated, and the template won't matter?
  // or. ugh. I dunno. BLARGH
  const processTemplate = (templateArr, corpora, options, existingText) => {
    // generate a variable-length array of words
    var initialNumberWords = templateArr.length * 2
    var generatedWordsArr = []
    var generatedWordsStaticArr = []

    // if there are any non-template words in template: generate from that
    //   (i.e. you've pasted in a poem to edit)
    // this is a great use-case, but might not work with this revised version
    // keep testing, to figure out how to do it
    // else if NO word button exists in the editor area, generate from scratch
    //   (i.e. you're starting a new poem)
    // otherwise make list based on whats in the editor area
    //   (i.e. you're re-generating a new version of a poem)

    if (existingText.length === 0) {
      // no saved words
      generatedWordsArr = makeWordsArray(initialNumberWords, options.byNewlineOrPunctuation, corpora)
    } else {
      for (var i = 0; i < existingText.length; i++) {
        var element = existingText[i]
        var editorWord = element.text

        if (element.keep) {
          generatedWordsStaticArr.push(true)
        } else {
          // word is not saved, change it up
          generatedWordsStaticArr.push(false)
          // if its the first word, find a new starting word
          // otherwise find a word based on the previous word
          // how different are these functions?
          // if a "previous" word is not passed in, get a word based on options
          // no need to pick things in this way, then.
          if (i === 0) {
            editorWord = getAFirstWord(options.byNewlineOrPunctuation, corpora)
          } else {
            editorWord = getAWord(generatedWordsArr[i - 1], corpora)
          }
        }

        generatedWordsArr.push(editorWord.toLowerCase())
      }
    }

    var tInfo = {
      generatedWordsArr,
      generatedWordsStaticArr
    }

    return tInfo
  }
}

module.exports = JGnoetry
