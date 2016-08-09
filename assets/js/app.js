/* global React, ReactDOM, moment, Scheduler, Session, getLimit */

var TODAY = moment().format('YYYY-MM-DD');

//-------------------------------------------------

var groupsOf = function (arr, count) {
  var result = [];
  for (var i = 0; i < arr.length; i += count) {
    result.push(arr.slice(i, i + count));
  }
  return result;
};

var scrollToSelected = function () {
  var selected = document.getElementsByClassName('selected')[0];
  if (!selected) {
    return;
  }
  var height     = selected.offsetHeight;
  var cardTop    = selected.offsetTop;
  var cardBot    = cardTop + height;
  var scrollTop  = window.scrollY;
  var scrollBot  = window.innerHeight + scrollTop;
  var paddingTop = 65;
  var paddingBot = 10;
  if (cardTop < scrollTop + paddingTop) {
    window.scrollTo(0, cardTop - paddingTop);
    return;
  }
  if (cardBot > scrollBot - paddingBot) {
    window.scrollTo(0, cardBot - window.innerHeight + paddingBot);
    return;
  }
};

//-------------------------------------------------

var ACTIONS = (function () {
  var DECKS;         // contains the decks, used to update state
  var SELECTED_CARD; // card with focus

  var exports = {};

  var renderDecks = exports.renderDecks = function () {
    ReactDOM.render(React.createElement(Session, {decks: DECKS}), document.getElementById('decks'));
  };

  exports.setLimit = function (deck, limit) {
    deck.limit = limit;
    renderDecks();
  };

  var fetchDecks = exports.fetchDecks = function () {
    fetch('/decks.json').then(function (response) {
      return response.json();
    }).then(function (decks) {
      DECKS = decks;
      //..............
      // augment, shuffle
      DECKS.forEach(function (deck) {
        if (!deck.cards) {
          deck.cards = [];
        }
        deck.cards = deck.cards.sort(function () { return 0.5 - Math.random(); });
      });
      //..............
      renderDecks();
    }).catch(function (err) {
      throw err;
    });
  };

  exports.saveDecks = function () {
    var updatedDecks = DECKS.filter(function (deck) {
      return deck.cards.some(function (card) {
        return card.mark !== undefined;
      });
    }).map(function (deck) {
      var result = {};
      result.filename = deck.filename;
      result.updates = {};
      deck.cards.filter(function (card) {
        return card.mark !== undefined;
      }).forEach(function (card) {
        var days = Scheduler.daysUntilNext(card.mark, card.last);
        var next = moment(TODAY).add(days, 'days').format('YYYY-MM-DD');
        result.updates[card.question] = {
          mark:     card.mark,
          next:     next,
        };
      });
      return result;
    });
    if (updatedDecks.length === 0) {
      return; // don't save... no point
    }
    SELECTED_CARD = null;
    fetch('/decks', {
      method: 'POST',
      headers: new Headers({'Content-Type': 'application/json'}),
      body: JSON.stringify(updatedDecks),
    }).then(function () {
      fetchDecks();
    }).catch(function (err) {
      throw err;
    });
  };

  exports.selectDiff = function (dx, dy, lineCount) {
    if (!SELECTED_CARD) {
      dx = 0;
      dy = 0;
    }
    var lines = [];
    DECKS.forEach(function (deck) {
      lines = lines.concat(groupsOf(deck.cards.slice(0, getLimit(deck)), lineCount));
    });
    if (lines.length === 0) {
      return;
    }
    var x = 0;
    var y = 0;
    lines.some(function (line, i) {
      if (line.indexOf(SELECTED_CARD) >= 0) {
        x = line.indexOf(SELECTED_CARD);
        y = i;
        return true;
      }
    });
    var constraint = function (value, min, max) {
      if (value < min) { return min; }
      if (value > max) { return max; }
      return value;
    };
    // wrap left
    if (x === 0 && dx === -1 && y > 0) {
      dx = 0;
      x  = lineCount;
      y  = y - 1;
    }
    // wrap right
    if (x === lines[y].length - 1 && dx === 1 && y < lines.length - 1) {
      dx = 0;
      x  = 0;
      y  = y + 1;
    }
    y = constraint(y + dy, 0, lines.length - 1);
    x = constraint(x + dx, 0, lines[y].length - 1);
    exports.selectCard(lines[y][x]);
    setTimeout(function () {
      scrollToSelected();
    }, 100);
  };

  exports.selectCard = function (card) {
    if (!card) { return; }
    if (SELECTED_CARD) {
      delete SELECTED_CARD.flipped;
      delete SELECTED_CARD.selected;
    }
    card.selected = true;
    SELECTED_CARD = card;
    renderDecks();
  };

  exports.markCard = function (mark) {
    if (!SELECTED_CARD) {
      return;
    }
    SELECTED_CARD.mark = mark;
    renderDecks();
  };

  exports.flipCard = function (flipped) {
    if (!SELECTED_CARD) {
      return;
    }
    if (flipped === undefined) {
      flipped = !SELECTED_CARD.flipped;
    }
    SELECTED_CARD.flipped = flipped;
    renderDecks();
  };

  return exports;
}());

//-------------------------------------------------

window.addEventListener("keydown", function (e) {
  var code = e.keyCode;
  if (code === 89) {  // y => 1
    ACTIONS.markCard(1);
    return;
  }
  if (code === 78) {  // y => 0
    ACTIONS.markCard(0);
    return;
  }
  if (code === 32) {  // space
    e.preventDefault();
    ACTIONS.flipCard(true);
    return;
  }
  if (code === 83 && (e.ctrlKey || e.metaKey)) {  // cmd-s, ctrl-s
    e.preventDefault();
    ACTIONS.saveDecks();
    return;
  }
  //-------------------------------------------------
  var margins   = 30 + 10;
  var cardWidth = 300 + 10;
  var lineCount = Math.floor((window.innerWidth - margins) / cardWidth);
  //-------------------------------------------------
  if (code === 37) {  // left
    e.preventDefault();
    ACTIONS.selectDiff(-1, 0, lineCount);
    return;
  }
  if (code === 39) {  // right
    e.preventDefault();
    ACTIONS.selectDiff(1, 0, lineCount);
    return;
  }
  if (code === 38) {  // up
    e.preventDefault();
    ACTIONS.selectDiff(0, -1, lineCount);
    return;
  }
  if (code === 40) {  // down
    e.preventDefault();
    ACTIONS.selectDiff(0, 1, lineCount);
    return;
  }
  //console.log(e.keyCode);
}, false);

window.addEventListener("keyup", function (e) {
  var code = e.keyCode;
  if (code === 32) {  // space
    e.preventDefault();
    ACTIONS.flipCard(false);
    return;
  }
}, false);

//-------------------------------------------------

ACTIONS.fetchDecks(); // bootstrap everything
