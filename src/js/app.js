/* global React, ReactDOM, moment, document, window, fetch, Headers, prompt */

const scheduler = require("./scheduler");
const utils = require("./utils");

const TODAY = moment().format("YYYY-MM-DD");
let mouseSelectionAllowed = true;

const elem = React.createElement;

let Session;

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
      lines = lines.concat(utils.groupsOf(deck.cards.slice(0, utils.getLimit(LIMITS[deck.filename], deck.cards.length)), lineCount));
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
      y = utils.clamp(y + dy, 0, lines.length - 1);
      x = utils.clamp(x + dx, 0, lines[y].length - 1);
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

const Card = React.createClass({
  displayName: "card",
  handleUp() {
    ACTIONS.flipCard(false);
  },
  handleDown() {
    ACTIONS.flipCard(true);
  },
  select() {
    if (!mouseSelectionAllowed) {
      return;
    }
    ACTIONS.selectCard(this.props.card);
  },
  render() {
    const {card} = this.props;
    const text = card.flipped ? card.answer : card.question;
    const classNames = ["card"];
    if (card.selected) {
      classNames.push("selected");
    }
    if (card.mark !== undefined) {
      classNames.push(card.mark ? "passed" : "failed");
    }
    let preview;
    {
      const [minDays, maxDays] = scheduler.daysPreview(card.last);
      preview = minDays === 0 ? "1 day" : `${minDays}..${maxDays} days`;
    }
    return elem(
      "div",
      {
        className: classNames.join(" "),
        onMouseDown: this.handleDown,
        onMouseUp: this.handleUp,
        onMouseEnter: this.select,
      },
      elem("span", {className: "text"}, text),
      elem("span", {className: "preview"}, preview)
    );
  },
});

const Deck = React.createClass({
  displayName: "deck",
  getInitialState() {
    return {};
  },
  handleClick() {
    // eslint-disable-next-line no-alert
    let limit = prompt("How many cards", utils.getLimit(LIMITS[this.props.deck.filename], this.props.deck.cards.length));
    limit = parseInt(limit, 10);
    if (!Number.isNaN(limit)) {
      LIMITS[this.props.deck.filename] = limit; // used in app.js
      this.setState({limit});
    }
  },
  render() {
    let {cards} = this.props.deck;
    let subtext = utils.pluralize(cards.length, "card");
    const limit = utils.getLimit(this.state.limit, this.props.deck.cards);
    if (limit) {
      if (limit < cards.length) {
        subtext = `${limit} of ${subtext}`;
      }
      cards = cards.slice(0, limit);
    }
    if (cards.length === 0) {
      return false; // aka render "nothing"
    }
    const {filename} = this.props.deck;
    const cardsHTML = cards.map(card => elem(Card, {card}));
    return elem(
      "div",
      {className: "deck"},
      elem("hgroup", {onClick: this.handleClick}, elem("h2", null, filename), elem("h3", {className: "subtext"}, subtext)),
      elem("div", {className: "cards"}, cardsHTML)
    );
  },
});

Session = React.createClass({
  displayName: "session",
  render() {
    const decksHTML = this.props.decks.map(deck => elem(Deck, {deck}));
    return elem("div", null, decksHTML);
  },
});

//-------------------------------------------------

ACTIONS.fetchDecks(); // bootstrap everything
