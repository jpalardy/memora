/* global React, ReactDOM, moment, scheduler, Session, getLimit, document, window, fetch, Headers, groupsOf, clamp */

const TODAY = moment().format("YYYY-MM-DD");
let mouseSelectionAllowed = true;

//-------------------------------------------------

function scrollToSelected() {
  const selected = document.getElementsByClassName("selected")[0];
  if (!selected) {
    return;
  }
  const height = selected.offsetHeight;
  const cardTop = selected.offsetTop;
  const cardBot = cardTop + height;
  const scrollTop = window.scrollY;
  const scrollBot = window.innerHeight + scrollTop;
  const paddingTop = 65;
  const paddingBot = 10;
  if (cardTop < scrollTop + paddingTop) {
    window.scrollTo(0, cardTop - paddingTop);
    return;
  }
  if (cardBot > scrollBot - paddingBot) {
    window.scrollTo(0, cardBot - window.innerHeight + paddingBot); // eslint-disable-line no-mixed-operators
  }
}

//-------------------------------------------------

// global state for deck limits...
const LIMITS = {};

const ACTIONS = (() => {
  let DECKS; // contains the decks, used to update state
  let SELECTED_CARD; // card with focus

  const exports = {};

  exports.renderDecks = () => {
    ReactDOM.render(React.createElement(Session, {decks: DECKS}), document.getElementById("decks"));
  };

  exports.fetchDecks = () => {
    fetch("/decks.json")
      .then(response => response.json())
      .then(decks => {
        DECKS = decks;
        // augment, shuffle
        DECKS.forEach(deck => {
          deck.cards = (deck.cards || []).sort(() => 0.5 - Math.random());
        });
        exports.renderDecks();
      });
  };

  exports.saveDecks = () => {
    const updatedDecks = DECKS.filter(deck => deck.cards.some(card => card.mark !== undefined)).map(deck => {
      const result = {
        filename: deck.filename,
        updates: {},
      };
      deck.cards.filter(card => card.mark !== undefined).forEach(card => {
        const days = scheduler.daysUntilNext(card.mark, card.last);
        const next = moment(TODAY)
          .add(days, "days")
          .format("YYYY-MM-DD");
        result.updates[card.question] = {mark: card.mark, next};
      });
      return result;
    });
    if (updatedDecks.length === 0) {
      return; // don't save... no point
    }
    SELECTED_CARD = null;
    fetch("/decks", {
      method: "POST",
      headers: new Headers({"Content-Type": "application/json"}),
      body: JSON.stringify(updatedDecks),
    }).then(exports.fetchDecks);
  };

  exports.selectDiff = (dx, dy, lineCount) => {
    //-------------------------------------------------
    // disable mouse selection after a move
    mouseSelectionAllowed = false;
    setTimeout(() => {
      mouseSelectionAllowed = true;
    }, 250);
    //-------------------------------------------------
    if (!SELECTED_CARD) {
      dx = 0;
      dy = 0;
    }
    let lines = [];
    DECKS.forEach(deck => {
      lines = lines.concat(groupsOf(deck.cards.slice(0, getLimit(LIMITS[deck.filename], deck.cards.length)), lineCount));
    });
    if (lines.length === 0) {
      return;
    }
    let x = 0;
    let y = 0;
    lines.some((line, i) => {
      if (line.indexOf(SELECTED_CARD) >= 0) {
        x = line.indexOf(SELECTED_CARD);
        y = i;
        return true;
      }
      return false;
    });
    if (x === 0 && dx === -1 && y > 0) { // wrap left
      x = lineCount;
      y -= 1;
    } else if (x === lines[y].length - 1 && dx === 1 && y < lines.length - 1) { // wrap right
      x = 0;
      y += 1;
    } else {
      y = clamp(y + dy, 0, lines.length - 1);
      x = clamp(x + dx, 0, lines[y].length - 1);
    }
    exports.selectCard(lines[y][x]);
    setTimeout(() => {
      scrollToSelected();
    }, 100);
  };

  exports.selectCard = card => {
    if (!card) {
      return;
    }
    if (SELECTED_CARD) {
      delete SELECTED_CARD.flipped;
      delete SELECTED_CARD.selected;
    }
    card.selected = true;
    SELECTED_CARD = card;
    exports.renderDecks();
  };

  exports.markCard = mark => {
    if (!SELECTED_CARD) {
      return;
    }
    SELECTED_CARD.mark = mark;
    exports.renderDecks();
  };

  exports.flipCard = (flipped = !SELECTED_CARD.flipped) => {
    if (!SELECTED_CARD) {
      return;
    }
    SELECTED_CARD.flipped = flipped;
    exports.renderDecks();
  };

  return exports;
})();

//-------------------------------------------------

window.addEventListener(
  "keydown",
  e => {
    const code = e.keyCode;
    if (code === 89) {
      // y => 1
      ACTIONS.markCard(1);
      return;
    }
    if (code === 78) {
      // y => 0
      ACTIONS.markCard(0);
      return;
    }
    if (code === 32) {
      // space
      e.preventDefault();
      ACTIONS.flipCard(true);
      return;
    }
    if (code === 83 && (e.ctrlKey || e.metaKey)) {
      // cmd-s, ctrl-s
      e.preventDefault();
      ACTIONS.saveDecks();
      return;
    }
    //-------------------------------------------------
    const margins = 30 + 10;
    const cardWidth = 300 + 10;
    const lineCount = Math.floor((window.innerWidth - margins) / cardWidth);
    //-------------------------------------------------
    if (code === 37) {
      // left
      e.preventDefault();
      ACTIONS.selectDiff(-1, 0, lineCount);
      return;
    }
    if (code === 39) {
      // right
      e.preventDefault();
      ACTIONS.selectDiff(1, 0, lineCount);
      return;
    }
    if (code === 38) {
      // up
      e.preventDefault();
      ACTIONS.selectDiff(0, -1, lineCount);
      return;
    }
    if (code === 40) {
      // down
      e.preventDefault();
      ACTIONS.selectDiff(0, 1, lineCount);
      // return;
    }
    // console.log(e.keyCode);
  },
  false
);

window.addEventListener(
  "keyup",
  e => {
    const code = e.keyCode;
    if (code === 32) {
      // space
      e.preventDefault();
      ACTIONS.flipCard(false);
      // return;
    }
  },
  false
);

//-------------------------------------------------

ACTIONS.fetchDecks(); // bootstrap everything
