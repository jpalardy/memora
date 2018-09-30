// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"TuEg":[function(require,module,exports) {
function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/* global dayjs */

var scheduler = {
  rangeRand: function rangeRand(min, max) {
    return min + Math.floor((max - min + 1) * Math.random()); // eslint-disable-line
  },
  doubler: function doubler(lastTime) {
    var daysSinceLast = dayjs().diff(dayjs(lastTime), "days");
    return daysSinceLast * 2;
  },
  daysRange: function daysRange(days) {
    var variance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Math.ceil(days / 6);

    return [days - variance, days + variance];
  },
  daysPreview: function daysPreview(lastTime, variance) {
    var days = this.doubler(lastTime);
    return this.daysRange(days, variance);
  },
  daysUntilNext: function daysUntilNext(success, lastTime, variance) {
    if (!success) {
      return 0;
    }
    return Math.max(1, this.rangeRand.apply(this, _toConsumableArray(this.daysPreview(lastTime, variance))));
  }
};

module.exports = scheduler;
},{}],"FO+Z":[function(require,module,exports) {
var utils = {
  pluralize: function pluralize(count, singular) {
    var plural = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : singular + "s";

    return count + " " + (count === 1 ? singular : plural);
  },
  getLimit: function getLimit(limit, length) {
    if (limit) {
      return limit; // explicit limit
    }
    if (length < 16) {
      // tolerate 13..15
      return length;
    }
    return 12; // default to 12 (soft)
  },
  clamp: function clamp(value, min, max) {
    if (value < min) {
      return min;
    }
    if (value > max) {
      return max;
    }
    return value;
  },
  groupsOf: function groupsOf(arr, count) {
    var result = [];
    for (var i = 0; i < arr.length; i += count) {
      result.push(arr.slice(i, i + count));
    }
    return result;
  }
};

module.exports = utils;
},{}],"A2T1":[function(require,module,exports) {
var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/* global dayjs, React, ReactDOM, document, window, fetch, Headers, prompt */

var scheduler = require("./scheduler");
var utils = require("./utils");

function debounce(f, wait) {
  var timeoutId = null;
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(function () {
      return f.apply(undefined, args);
    }, wait);
  };
}

var mouseSelectionAllowed = true;
var waitAndEnableMouseSelection = debounce(function () {
  mouseSelectionAllowed = true;
}, 250);
var disableTemporarilyMouseSelection = function disableTemporarilyMouseSelection() {
  mouseSelectionAllowed = false;
  waitAndEnableMouseSelection();
};

var elem = React.createElement;

var Session = void 0;

//-------------------------------------------------

// eslint-disable-next-line prefer-arrow-callback
var waitAndScrollToSelected = debounce(function scrollToSelected() {
  var selected = document.getElementsByClassName("selected")[0];
  if (!selected) {
    return;
  }
  var height = selected.offsetHeight;
  var cardTop = selected.offsetTop;
  var cardBot = cardTop + height;
  var scrollTop = window.scrollY;
  var scrollBot = window.innerHeight + scrollTop;
  var paddingTop = 65;
  var paddingBot = 10;
  if (cardTop < scrollTop + paddingTop) {
    window.scrollTo(0, cardTop - paddingTop);
    return;
  }
  if (cardBot > scrollBot - paddingBot) {
    window.scrollTo(0, cardBot - window.innerHeight + paddingBot); // eslint-disable-line no-mixed-operators
  }
}, 100);

//-------------------------------------------------

// global state for deck limits...
var LIMITS = {};

var ACTIONS = function () {
  var DECKS = void 0; // contains the decks, used to update state
  var SELECTED_CARD = void 0; // card with focus

  var exports = {};

  exports.renderDecks = function () {
    ReactDOM.render(React.createElement(Session, { decks: DECKS }), document.getElementById("decks"));
  };

  exports.fetchDecks = function () {
    fetch("/decks.json").then(function (response) {
      return response.json();
    }).then(function (decks) {
      DECKS = decks;
      // augment, shuffle
      DECKS.forEach(function (deck) {
        deck.cards = (deck.cards || []).sort(function () {
          return 0.5 - Math.random();
        });
      });
      exports.renderDecks();
    });
  };

  exports.saveDecks = function () {
    var updatedDecks = DECKS.filter(function (deck) {
      return deck.cards.some(function (card) {
        return card.mark !== undefined;
      });
    }).map(function (deck) {
      var result = {
        filename: deck.filename,
        updates: {}
      };
      deck.cards.filter(function (card) {
        return card.mark !== undefined;
      }).forEach(function (card) {
        var days = scheduler.daysUntilNext(card.mark, card.last);
        var next = dayjs().add(days, "days").format("YYYY-MM-DD");
        result.updates[card.question] = { mark: card.mark, next: next };
      });
      return result;
    });
    if (updatedDecks.length === 0) {
      return; // don't save... no point
    }
    SELECTED_CARD = null;
    fetch("/decks", {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(updatedDecks)
    }).then(exports.fetchDecks);
  };

  exports.selectDiff = function (dx, dy, lineCount) {
    //-------------------------------------------------
    disableTemporarilyMouseSelection();
    //-------------------------------------------------
    if (!SELECTED_CARD) {
      dx = 0; // eslint-disable-line
      dy = 0; // eslint-disable-line
    }
    var lines = [];
    DECKS.forEach(function (deck) {
      lines = lines.concat(utils.groupsOf(deck.cards.slice(0, utils.getLimit(LIMITS[deck.filename], deck.cards.length)), lineCount));
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
      return false;
    });
    if (x === 0 && dx === -1 && y > 0) {
      // wrap left
      y -= 1;
      x = lines[y].length - 1;
    } else if (x === lines[y].length - 1 && dx === 1 && y < lines.length - 1) {
      // wrap right
      y += 1;
      x = 0;
    } else {
      y = utils.clamp(y + dy, 0, lines.length - 1); // order matters!
      x = utils.clamp(x + dx, 0, lines[y].length - 1);
    }
    exports.selectCard(lines[y][x]);
    waitAndScrollToSelected();
  };

  exports.selectCard = function (card) {
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

  exports.markCard = function (mark) {
    if (!SELECTED_CARD) {
      return;
    }
    SELECTED_CARD.mark = mark;
    exports.renderDecks();
  };

  exports.flipCard = function () {
    var flipped = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : !SELECTED_CARD.flipped;

    if (!SELECTED_CARD) {
      return;
    }
    SELECTED_CARD.flipped = flipped;
    exports.renderDecks();
  };

  return exports;
}();

//-------------------------------------------------

window.addEventListener("keydown", function (e) {
  var code = e.keyCode;
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
  var margins = 30 + 10;
  var cardWidth = 300 + 10;
  var lineCount = Math.floor((window.innerWidth - margins) / cardWidth);
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
}, false);

window.addEventListener("keyup", function (e) {
  var code = e.keyCode;
  if (code === 32) {
    // space
    e.preventDefault();
    ACTIONS.flipCard(false);
    // return;
  }
}, false);

//-------------------------------------------------

var Card = React.createClass({
  displayName: "card",
  handleUp: function handleUp() {
    ACTIONS.flipCard(false);
  },
  handleDown: function handleDown() {
    ACTIONS.flipCard(true);
  },
  select: function select() {
    if (!mouseSelectionAllowed) {
      return;
    }
    ACTIONS.selectCard(this.props.card);
  },
  render: function render() {
    var card = this.props.card;

    var text = card.flipped ? card.answer : card.question;
    var classNames = ["card"];
    if (card.selected) {
      classNames.push("selected");
    }
    if (card.mark !== undefined) {
      classNames.push(card.mark ? "passed" : "failed");
    }
    var preview = void 0;
    {
      var _scheduler$daysPrevie = scheduler.daysPreview(card.last),
          _scheduler$daysPrevie2 = _slicedToArray(_scheduler$daysPrevie, 2),
          minDays = _scheduler$daysPrevie2[0],
          maxDays = _scheduler$daysPrevie2[1];

      preview = minDays === 0 ? "1 day" : minDays + ".." + maxDays + " days";
    }
    return elem("div", {
      className: classNames.join(" "),
      onMouseDown: this.handleDown,
      onMouseUp: this.handleUp,
      onMouseEnter: this.select
    }, elem("span", { className: "text" }, text), elem("span", { className: "preview" }, preview));
  }
});

var Deck = React.createClass({
  displayName: "deck",
  getInitialState: function getInitialState() {
    return {};
  },
  handleClick: function handleClick() {
    // eslint-disable-next-line no-alert
    var limit = prompt("How many cards", utils.getLimit(LIMITS[this.props.deck.filename], this.props.deck.cards.length));
    limit = parseInt(limit, 10);
    if (!Number.isNaN(limit)) {
      LIMITS[this.props.deck.filename] = limit; // used in app.js
      this.setState({ limit: limit });
    }
  },
  render: function render() {
    var cards = this.props.deck.cards;

    var subtext = utils.pluralize(cards.length, "card");
    var limit = utils.getLimit(this.state.limit, this.props.deck.cards.length);
    if (limit) {
      if (limit < cards.length) {
        subtext = limit + " of " + subtext;
      }
      cards = cards.slice(0, limit);
    }
    if (cards.length === 0) {
      return false; // aka render "nothing"
    }
    var filename = this.props.deck.filename;

    var cardsHTML = cards.map(function (card) {
      return elem(Card, { card: card });
    });
    return elem("div", { className: "deck" }, elem("hgroup", { onClick: this.handleClick }, elem("h2", null, filename), elem("h3", { className: "subtext" }, subtext)), elem("div", { className: "cards" }, cardsHTML));
  }
});

Session = React.createClass({
  displayName: "session",
  render: function render() {
    var decksHTML = this.props.decks.map(function (deck) {
      return elem(Deck, { deck: deck });
    });
    return elem("div", null, decksHTML);
  }
});

//-------------------------------------------------

ACTIONS.fetchDecks(); // bootstrap everything
},{"./scheduler":"TuEg","./utils":"FO+Z"}]},{},["A2T1"], null)