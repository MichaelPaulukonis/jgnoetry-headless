# jgnoetry HEADLESS

 Based very heavily on code originally Copyright 2011 Edde Addad
 Based on Gnoetry by Jon Trowbridge and Eric Elshtain

I probably should have rewritten it from scratch - which is essential what Edde Addad did.
But I've been using and abusing it, and incrementally modifying it.

For whatever reason, my modifications are in the `gh-pages` branch of my fork of Addad's poetry generators.

https://github.com/MichaelPaulukonis/poetrygen/tree/gh-pages/jGnoetry

SO IT GOES

## running


## testing
`npm t`

## publishing


## working notes
TODO: building a template from text, or using a combination of template + existing text is not currently active.


```
[{"id":"","text":"weary","backgroundColor":"transparent"},{"id":"","text":"car","backgroundColor":"transparent"},{"id":"","text":",","backgroundColor":"transparent"},{"id":"","text":"conquest","backgroundColor":"transparent"},{"id":"","text":"and","backgroundColor":"transparent"},{"id":"","text":"wherefore","backgroundColor":"transparent"},{"id":"","text":",","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"if","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"ten","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"times","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"happier","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"unless","backgroundColor":"transparent"},{"id":"","text":"this","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"thought","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":",","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"herein","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"lives","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"th","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"inviting","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"time","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"debateth","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"story","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":",","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"and","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"true","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"hearts","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"perspective","backgroundColor":"transparent"},{"id":"","text":"it","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"with","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"her","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":"pipe","backgroundColor":"rgb(255, 153, 153)"},{"id":"","text":".","backgroundColor":"transparent"}]
```

transparent === keep
rgb = lost

NOTE: there are several multi-syllable words in there, they are one unit.

NOTE: generatedWordsStaticArr is only true/false 
where true is set when "keep"

This is processed, based on an array like:

`existingText = [{ text: 'Keeper', keep: true }, { keep: false }, { keep: false }, { text: 'Barleycorn', keep: true }]`

I don't understand yet how this applies to the template and syllables.

Also: I would like for additional token to be in the template, so we can supply pre-formed text, punctuation, etc.

so that

```
First [s] [s]: [s] [s] [s], [n]
Second [s] [s]: [s] [s] [s]!
```

Could be a thing.