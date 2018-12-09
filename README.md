
# Memora

[![travis-build-status](https://travis-ci.org/jpalardy/memora.svg?branch=master)](https://travis-ci.org/jpalardy/memora)

Memora is a flashcard app, like [Supermemo](https://www.supermemo.com/),
[Anki](http://ankisrs.net/), or one of the other software you can use to do
[spaced repetition](https://en.wikipedia.org/wiki/Spaced_repetition).

It is written in Go, runs as a webapp on your computer, and uses a very simple
file format to store your flashcards.


## How to install?

On a mac:

    > brew tap jpalardy/tap
    > brew install memora

From source:

    > go get -d -u -v github.com/jpalardy/memora
    > cd $(go env GOPATH)/src/github.com/jpalardy/memora
    > go build -o bin/memora
    # the memora binary in the `bin` subdirectory

The memora binary is compiled with the location of the assets (HTML,
JavaScript, CSS) it needs to run its webapp. If the assets are moved, you'll
need to recompile the binary or use the `-assets` flag when you run memora.


## How to use?

First, you need to build "decks" of things you want to study. Some example
decks are provided in the [samples](samples) directory of this repo.

The [next section](https://github.com/jpalardy/memora#how-to-build-a-deck) describes how to build your own decks.

Start memora and give it the filename of the decks you would like to review:

    > memora capitals.deck hello.deck

Open your web browser to http://127.0.0.1:4567

Each deck will have its own section with cards scheduled for review. You can:

* hover a card to highlight
* hold the spacebar to flip a card (look at the answer)
* press 'y' to mark a card as remembered -- card will turn green
* press 'n' to mark a card as forgotten -- card will turn red
* press 'cmd-s' to save your progress
* you can use the keyboard arrows to navigate between cards

Saving your progress means overwriting the `.deck` file. All changes are done
inplace on the file. The deck file is a database, of sorts.

Not all cards will appear for each deck -- only cards scheduled for review.
Also, after you save, some decks might disappear because they don't contain any
more scheduled cards.


## How to build a deck?

Decks contain cards. Cards have a question and an answer.

In the hello sample deck, the cards' question is in a specific language (french)
and the answer contains what word (bonjour) means hello in that language. In
the file itself, cards are separated into paragraphs by empty lines. The first
line of a paragraph contains the question, the second line contains the answer.

For example:

    french
    bonjour

It's as simple as that.

If you start memora on a deck, it assumes that all cards are due _today_. If
that's not what you want, you can add a third line to a card to say when the
card is scheduled next (YYYY-MM-DD):

    french
    bonjour
    2016-08-31

Note that if you grade a card, it will re-schedule itself automatically.

Once cards are graded, the fourth line will contain the history of when you graded it
and what grade (0: fail, 1: pass) you gave yourself.

-------------------------------------------------

## How are cards scheduled?

If you mark a card as forgotten, it is re-scheduled for the day.

If you mark a card as remembered, it will re-schedule itself for double the
duration since the last time you reviewed it. (To avoid all cards being
rescheduled together, a "wiggle" of 1/6 the duration until the next review is
used to scatter the exact date)

The bottom-right corner of a card tells you when a card will come up next. If a
card will be scheduled in the far future, and you aren't comfortable with that
assessment of your knowledge, you can mark the card as "forgotten" the repeat
the cycle.

