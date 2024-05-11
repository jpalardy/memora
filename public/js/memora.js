(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // lib/scheduler.js
  var require_scheduler = __commonJS({
    "lib/scheduler.js"(exports, module) {
      var scheduler2 = {
        daysSince(time) {
          return dayjs().diff(dayjs(time), "days");
        },
        rangeRand(min, max) {
          return min + Math.floor((max - min + 1) * Math.random());
        },
        daysRange(days, variance = Math.ceil(days / 6)) {
          return [days - variance, days + variance];
        },
        daysPreview(lastTime, variance) {
          const days = this.daysSince(lastTime) * 2;
          return this.daysRange(days, variance);
        },
        daysUntilNext(success, lastTime, variance) {
          if (!success) {
            return 0;
          }
          return Math.max(1, this.rangeRand(...this.daysPreview(lastTime, variance)));
        }
      };
      module.exports = scheduler2;
    }
  });

  // lib/backend.js
  var require_backend = __commonJS({
    "lib/backend.js"(exports) {
      var scheduler2 = require_scheduler();
      exports.load = () => fetch("/decks.json").then((response) => response.json()).then((decks) => {
        decks.forEach((deck, i) => {
          deck.key = `deck-${i}`;
          deck.cards = deck.cards || [];
          deck.cards.forEach((card, i2) => {
            card.key = `card-${i2}`;
            card.selected = false;
            card.flipped = false;
            card.passed = null;
          });
          deck.cards.sort(() => Math.random() - 0.5);
        });
        return decks;
      });
      exports.save = (decks) => {
        const updatedDecks = decks.filter((deck) => deck.cards.some((card) => card.passed !== null)).map((deck) => {
          const result = {
            filename: deck.filename,
            updates: {}
          };
          deck.cards.filter((card) => card.passed !== null).forEach((card) => {
            const days = scheduler2.daysUntilNext(card.passed, card.last);
            const next = dayjs().add(days, "days").format("YYYY-MM-DD");
            result.updates[card.question] = { mark: card.passed ? 1 : 0, next };
          });
          return result;
        });
        if (updatedDecks.length === 0) {
          return Promise.resolve();
        }
        return fetch("/decks", {
          method: "POST",
          headers: new Headers({ "Content-Type": "application/json" }),
          body: JSON.stringify(updatedDecks)
        });
      };
    }
  });

  // lib/utils.js
  var require_utils = __commonJS({
    "lib/utils.js"(exports, module) {
      var utils = {
        clamp(value, min, max) {
          if (value < min) {
            return min;
          }
          if (value > max) {
            return max;
          }
          return value;
        },
        groupBy(arr, iteratee) {
          const result = /* @__PURE__ */ new Map();
          arr.forEach((item) => {
            const key = iteratee(item);
            if (!result.has(key)) {
              result.set(key, []);
            }
            result.get(key).push(item);
          });
          return result;
        },
        indexRagged(haystack, needle) {
          for (let y = 0; y < haystack.length; y += 1) {
            const x = haystack[y].indexOf(needle);
            if (x !== -1) {
              return [x, y];
            }
          }
          return [0, 0];
        },
        findRelativeTo(cards, selectedCard, dx, dy) {
          if (cards.length === 0) {
            return null;
          }
          if (!selectedCard) {
            return dx === 1 || dy === 1 ? cards[0] : cards[cards.length - 1];
          }
          const groups = utils.groupBy(cards, (card) => card.getBoundingClientRect().top);
          const keys = [...groups.keys()].sort((a, b) => a - b);
          const lines = keys.map((k) => groups.get(k));
          let [x, y] = utils.indexRagged(lines, selectedCard);
          if (x === 0 && dx === -1 && y > 0) {
            y -= 1;
            x = lines[y].length - 1;
          } else if (x === lines[y].length - 1 && dx === 1 && y < lines.length - 1) {
            y += 1;
            x = 0;
          } else {
            y = utils.clamp(y + dy, 0, lines.length - 1);
            x = utils.clamp(x + dx, 0, lines[y].length - 1);
          }
          return lines[y][x];
        }
      };
      module.exports = utils;
    }
  });

  // lib/keyboard.js
  var require_keyboard = __commonJS({
    "lib/keyboard.js"(exports) {
      var utils = require_utils();
      function keysFor(ev) {
        return [
          ev.metaKey && "Meta",
          // ⏎
          ev.ctrlKey && "Ctrl",
          ev.altKey && "Alt",
          ev.key
        ].filter((v) => v).join("-");
      }
      exports.handle = (app2, backend2) => {
        window.addEventListener(
          "keydown",
          (ev) => {
            const keys = keysFor(ev);
            if (keys === " ") {
              ev.preventDefault();
              app2.flipCard(true);
            }
            if (keys === "y") {
              app2.markCard(true);
            }
            if (keys === "n") {
              app2.markCard(false);
            }
            if (keys === "Meta-s" || keys === "Ctrl-s") {
              ev.preventDefault();
              backend2.save(app2.decks).then(backend2.load).then((decks) => {
                app2.decks = decks;
              });
            }
            if (keys === "r") {
              app2.redoes = !app2.redoes;
            }
            const selectCard = (selector) => {
              ev.preventDefault();
              const visibleCards = document.querySelectorAll(".card");
              const selectedCard = document.querySelector(".selected");
              const card = selector(visibleCards, selectedCard);
              if (card) {
                app2.selectCard(card.__vue__.card, { source: "keyboard" });
              }
            };
            if (keys === "ArrowLeft") {
              selectCard((visibleCards, selectedCard) => utils.findRelativeTo(visibleCards, selectedCard, -1, 0));
            }
            if (keys === "ArrowRight") {
              selectCard((visibleCards, selectedCard) => utils.findRelativeTo(visibleCards, selectedCard, 1, 0));
            }
            if (keys === "ArrowUp") {
              selectCard((visibleCards, selectedCard) => utils.findRelativeTo(visibleCards, selectedCard, 0, -1));
            }
            if (keys === "ArrowDown") {
              selectCard((visibleCards, selectedCard) => utils.findRelativeTo(visibleCards, selectedCard, 0, 1));
            }
            if (keys === "Home") {
              selectCard((visibleCards) => visibleCards[0]);
            }
            if (keys === "End") {
              selectCard((visibleCards) => visibleCards[visibleCards.length - 1]);
            }
          },
          false
        );
        window.addEventListener(
          "keyup",
          (ev) => {
            const keys = keysFor(ev);
            if (keys === " ") {
              ev.preventDefault();
              app2.flipCard(false);
            }
          },
          false
        );
      };
    }
  });

  // lib/browser.js
  var require_browser = __commonJS({
    "lib/browser.js"(exports) {
      function debounce(f, wait) {
        let timeoutId = null;
        return (...args) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => f(...args), wait);
        };
      }
      exports.waitAndScrollToSelected = debounce(() => {
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
          window.scrollTo(0, cardBot - window.innerHeight + paddingBot);
        }
      }, 100);
    }
  });

  // lib/app.js
  var scheduler = require_scheduler();
  var backend = require_backend();
  var keyboard = require_keyboard();
  var browser = require_browser();
  var app = new Vue({
    el: "#decks",
    template: `
    <div id="decks" class="container">
      <deck :deck="deck" :limit="limit" :key="deck.key" v-for="deck in decks">
      </deck>
    </div>
  `,
    data: {
      limit: 12,
      decks: [],
      selectedCard: null,
      redoes: false,
      mouse: true
      // turns off on keyboard, back on when moving
    },
    methods: {
      toggleMouse(state) {
        if (this.mouse === state) {
          return;
        }
        this.mouse = state;
        document.body.classList.toggle("mouse-off", !state);
      },
      selectCard(card, { source }) {
        if (this.selectedCard === card) {
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
          this.toggleMouse(false);
          browser.waitAndScrollToSelected();
        }
      },
      markCard(passed) {
        if (!this.selectedCard) {
          return;
        }
        this.selectedCard.passed = passed;
      },
      flipCard(flipped) {
        if (!this.selectedCard) {
          return;
        }
        this.selectedCard.flipped = flipped;
      },
      handleMouse() {
        this.toggleMouse(true);
      }
    },
    mounted() {
      backend.load().then((decks) => {
        this.decks = decks;
        const params = new URLSearchParams(document.location.search);
        let limit = params.get("limit");
        if (!limit) {
          return;
        }
        limit = Number(limit);
        if (limit >= 0) {
          this.limit = limit || Infinity;
        }
      });
    },
    created() {
      window.addEventListener("mousemove", this.handleMouse);
    },
    destroyed() {
      window.removeEventListener("mousemove", this.handleMouse);
    }
  });
  Vue.component("deck", {
    props: ["deck", "limit"],
    template: `
    <div class="deck">
      <hgroup>
        <h2>{{ deck.filename }}</h2>
        <h3 class="subtext">{{ isLimited ? limit + " of " : ""}}{{ filteredCards | pluralize('card') }}</h3>
      </hgroup>
      <div class="cards">
        <card :card="card" :key="card.key" v-for="card in limitedCards"></card>
      </div>
      <div v-if="isLimited">
        <button @click="limit += 12"><span class="discoverable">{{ remainingCards | pluralize('card') }} left</span>...</button>
      </div>
    </div>
  `,
    computed: {
      filteredCards() {
        return this.deck.cards.filter((card) => app.redoes || !card.last || scheduler.daysSince(card.last) > 0);
      },
      isLimited() {
        return this.filteredCards.length > this.limit;
      },
      limitedCards() {
        return this.filteredCards.slice(0, this.limit);
      },
      remainingCards() {
        return this.filteredCards.slice(this.limit);
      }
    }
  });
  Vue.component("card", {
    props: ["card"],
    template: `
    <div class="card" :class="classes"
         @mouseenter="select" @mousedown="flip(true)" @mouseup="flip(false)">
      <span class="text" v-html="text"></span>
      <span class="preview">{{ preview }}</span>
    </div>
  `,
    computed: {
      text() {
        return this.card.flipped ? this.card.answer : this.card.question;
      },
      classes() {
        const result = {
          selected: this.card.selected,
          passed: this.card.passed,
          failed: false
        };
        if (this.card.passed === false) {
          result.failed = true;
        }
        return result;
      },
      preview() {
        const [minDays, maxDays] = scheduler.daysPreview(this.card.last);
        return minDays === 0 ? "1 day" : `${minDays}..${maxDays} days`;
      }
    },
    methods: {
      select() {
        app.selectCard(this.card, { source: "mouse" });
      },
      flip(flipped) {
        this.card.flipped = flipped;
      }
    }
  });
  Vue.filter("pluralize", (count, singular, plural = `${singular}s`) => {
    if ("length" in count) {
      count = count.length;
    }
    if (count === 0) {
      return `no ${plural}`;
    }
    if (count === 1) {
      return `1 ${singular}`;
    }
    return `${count} ${plural}`;
  });
  keyboard.handle(app, backend);
  window.app = app;
})();
