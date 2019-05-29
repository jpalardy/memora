// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
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
      localRequire.cache = {};

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

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
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
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"scheduler.js":[function(require,module,exports) {
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

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
},{}],"backend.js":[function(require,module,exports) {
/* global fetch, dayjs, Headers */
var scheduler = require("./scheduler");

exports.load = function () {
  return fetch("/decks.json").then(function (response) {
    return response.json();
  }).then(function (decks) {
    decks.forEach(function (deck, i) {
      deck.key = "deck-".concat(i);
      deck.cards = deck.cards || []; // backend returns null... FIXME

      deck.cards.forEach(function (card, i) {
        card.key = "card-".concat(i);
        card.selected = false;
        card.flipped = false;
        card.passed = null;
      }); // shuffle cards

      deck.cards.sort(function () {
        return Math.random() - 0.5;
      });
    });
    return decks;
  });
};

exports.save = function (decks) {
  var updatedDecks = decks.filter(function (deck) {
    return deck.cards.some(function (card) {
      return card.passed !== null;
    });
  }).map(function (deck) {
    var result = {
      filename: deck.filename,
      updates: {}
    };
    deck.cards.filter(function (card) {
      return card.passed !== null;
    }).forEach(function (card) {
      var days = scheduler.daysUntilNext(card.passed, card.last);
      var next = dayjs().add(days, "days").format("YYYY-MM-DD");
      result.updates[card.question] = {
        mark: card.passed ? 1 : 0,
        next: next
      };
    });
    return result;
  });

  if (updatedDecks.length === 0) {
    return Promise.resolve(); // don't save... no point
  }

  return fetch("/decks", {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify(updatedDecks)
  });
};
},{"./scheduler":"scheduler.js"}],"utils.js":[function(require,module,exports) {
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var utils = {
  clamp: function clamp(value, min, max) {
    if (value < min) {
      return min;
    }

    if (value > max) {
      return max;
    }

    return value;
  },
  groupBy: function groupBy(arr, iteratee) {
    var result = new Map();
    arr.forEach(function (item) {
      var key = iteratee(item);

      if (!result.has(key)) {
        result.set(key, []);
      }

      result.get(key).push(item);
    });
    return result;
  },
  indexRagged: function indexRagged(haystack, needle) {
    for (var y = 0; y < haystack.length; y += 1) {
      var x = haystack[y].indexOf(needle);

      if (x !== -1) {
        return [x, y];
      }
    }

    return [0, 0];
  },
  findRelativeTo: function findRelativeTo(cards, selectedCard, dx, dy) {
    if (cards.length === 0) {
      return null;
    }

    if (!selectedCard) {
      dx = 0;
      dy = 0;
    }

    var groups = utils.groupBy(cards, function (card) {
      return card.getBoundingClientRect().top;
    });

    var keys = _toConsumableArray(groups.keys()).sort(function (a, b) {
      return a - b;
    });

    var lines = keys.map(function (k) {
      return groups.get(k);
    });

    var _utils$indexRagged = utils.indexRagged(lines, selectedCard),
        _utils$indexRagged2 = _slicedToArray(_utils$indexRagged, 2),
        x = _utils$indexRagged2[0],
        y = _utils$indexRagged2[1];

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

    return lines[y][x];
  }
};
module.exports = utils;
},{}],"keyboard.js":[function(require,module,exports) {
/* global window, document */
var utils = require("./utils");

exports.handle = function (app, backend) {
  window.addEventListener("keydown", function (e) {
    var code = e.keyCode; // space

    if (code === 32) {
      e.preventDefault();
      app.flipCard(true);
    } // y


    if (code === 89) {
      app.markCard(true);
    } // n


    if (code === 78) {
      app.markCard(false);
    } // cmd-s or ctrl-s


    if (code === 83 && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      backend.save(app.decks).then(backend.load).then(function (decks) {
        app.decks = decks;
      });
    } //-------------------------------------------------


    var selectCard = function selectCard(dx, dy) {
      e.preventDefault();
      var visibleCards = document.querySelectorAll(".card");
      var selectedCard = document.querySelector(".selected");
      var card = utils.findRelativeTo(visibleCards, selectedCard, dx, dy);

      if (card) {
        // eslint-disable-next-line no-underscore-dangle
        app.selectCard(card.__vue__.card, {
          source: "keyboard"
        });
      }
    }; // left


    if (code === 37) {
      selectCard(-1, 0);
    } // right


    if (code === 39) {
      selectCard(1, 0);
    } // up


    if (code === 38) {
      selectCard(0, -1);
    } // down


    if (code === 40) {
      selectCard(0, 1);
    }
  }, false);
  window.addEventListener("keyup", function (e) {
    var code = e.keyCode; // space

    if (code === 32) {
      e.preventDefault();
      app.flipCard(false);
    }
  }, false);
};
},{"./utils":"utils.js"}],"browser.js":[function(require,module,exports) {
/* global window, document */
function debounce(f, wait) {
  var timeoutId = null;
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(function () {
      return f.apply(void 0, args);
    }, wait);
  };
}

exports.waitAndScrollToSelected = debounce(function () {
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
},{}],"app.js":[function(require,module,exports) {
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/* global Vue, window */
var scheduler = require("./scheduler");

var backend = require("./backend");

var keyboard = require("./keyboard");

var browser = require("./browser");

var app = new Vue({
  el: "#decks",
  template: "\n    <div id=\"decks\" class=\"container\">\n      <deck :deck=\"deck\" :key=\"deck.key\" v-for=\"deck in nonEmptyDecks\">\n      </deck>\n    </div>\n  ",
  data: {
    decks: [],
    selectedCard: null,
    lastScrollAt: Date.now()
  },
  computed: {
    nonEmptyDecks: function nonEmptyDecks() {
      return this.decks.filter(function (deck) {
        return deck.cards.length;
      });
    }
  },
  methods: {
    selectCard: function selectCard(card, _ref) {
      var source = _ref.source;
      var now = Date.now();

      if (source === "mouse" && now - this.lastScrollAt < 250) {
        // too soon after scroll event
        return;
      }

      if (this.selectedCard) {
        this.selectedCard.flipped = false;
        this.selectedCard.selected = false;
      }

      this.selectedCard = card;
      this.selectedCard.flipped = false;
      this.selectedCard.selected = true;

      if (source === "keyboard") {
        // move to selected card if off-screen
        browser.waitAndScrollToSelected();
      }
    },
    markCard: function markCard(passed) {
      if (!this.selectedCard) {
        return;
      }

      this.selectedCard.passed = passed;
    },
    flipCard: function flipCard(flipped) {
      if (!this.selectedCard) {
        return;
      }

      this.selectedCard.flipped = flipped;
    },
    handleScroll: function handleScroll() {
      this.lastScrollAt = Date.now();
    }
  },
  mounted: function mounted() {
    var _this = this;

    backend.load().then(function (decks) {
      _this.decks = decks;
    });
  },
  created: function created() {
    window.addEventListener("scroll", this.handleScroll);
  },
  destroyed: function destroyed() {
    window.removeEventListener("scroll", this.handleScroll);
  }
});
Vue.component("deck", {
  props: ["deck"],
  template: "\n    <div class=\"deck\">\n      <hgroup>\n        <h2>{{ deck.filename }}</h2>\n        <h3 class=\"subtext\">{{ isLimited ? limit + \" of \" : \"\"}}{{ deck.cards | pluralize('card') }}</h3>\n      </hgroup>\n      <div class=\"cards\">\n        <card :card=\"card\" :key=\"card.key\" v-for=\"card in limitedCards\"></card>\n      </div>\n      <div v-if=\"isLimited\">\n        <button @click=\"limit += 12\">...</button>\n      </div>\n    </div>\n  ",
  data: function data() {
    return {
      limit: 12
    };
  },
  computed: {
    isLimited: function isLimited() {
      return this.limit < this.deck.cards.length;
    },
    limitedCards: function limitedCards() {
      return this.deck.cards.slice(0, this.limit);
    }
  }
});
Vue.component("card", {
  props: ["card"],
  template: "\n    <div class=\"card\" :class=\"classes\"\n         @mouseenter=\"select\" @mousedown=\"flip(true)\" @mouseup=\"flip(false)\">\n      <span class=\"text\" v-html=\"text\"></span>\n      <span class=\"preview\">{{ preview }}</span>\n    </div>\n  ",
  computed: {
    text: function text() {
      return this.card.flipped ? this.card.answer : this.card.question;
    },
    classes: function classes() {
      var result = {
        selected: this.card.selected,
        passed: this.card.passed,
        failed: false
      }; // avoid null

      if (this.card.passed === false) {
        result.failed = true;
      }

      return result;
    },
    preview: function preview() {
      var _scheduler$daysPrevie = scheduler.daysPreview(this.card.last),
          _scheduler$daysPrevie2 = _slicedToArray(_scheduler$daysPrevie, 2),
          minDays = _scheduler$daysPrevie2[0],
          maxDays = _scheduler$daysPrevie2[1];

      return minDays === 0 ? "1 day" : "".concat(minDays, "..").concat(maxDays, " days");
    }
  },
  methods: {
    select: function select() {
      app.selectCard(this.card, {
        source: "mouse"
      });
    },
    flip: function flip(flipped) {
      app.selectCard(this.card, {
        source: "mouse"
      });
      this.card.flipped = flipped;
    }
  }
}); //-------------------------------------------------

Vue.filter("pluralize", function (count, singular) {
  var plural = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "".concat(singular, "s");

  if ("length" in count) {
    count = count.length;
  }

  if (count === 0) {
    return "no ".concat(plural);
  }

  if (count === 1) {
    return "1 ".concat(singular);
  }

  return "".concat(count, " ").concat(plural);
}); //-------------------------------------------------

keyboard.handle(app, backend);
window.app = app;
},{"./scheduler":"scheduler.js","./backend":"backend.js","./keyboard":"keyboard.js","./browser":"browser.js"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "54332" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else {
        window.location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","app.js"], null)