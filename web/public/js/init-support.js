const now = new Date();
const adjustedNow = Date.now() - now.getTimezoneOffset() * 60 * 1000;
const app = Elm.Main.init({
  node: document.getElementById("app"),
  flags: adjustedNow,
});

// -------------------------------------------------
// keyboard
// -------------------------------------------------

function keysFor(ev) {
  return [
    ev.metaKey && "Meta",
    ev.ctrlKey && "Ctrl",
    ev.altKey && "Alt",
    ev.key,
  ]
    .filter((v) => v)
    .join("-");
}

window.addEventListener(
  "keydown",
  (ev) => {
    const keys = keysFor(ev);
    if (keys === " ") {
      ev.preventDefault();
      app.ports.preventedKeydown.send(" ");
      return;
    }

    if (keys === "Meta-s" || keys === "Ctrl-s") {
      ev.preventDefault();
      app.ports.preventedKeydown.send("Save");
      return;
    }

    const navigationKeys = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ];
    if (navigationKeys.includes(keys)) {
      ev.preventDefault();
      app.ports.preventedKeydown.send(keys);
      return;
    }
  },
  false,
);

window.addEventListener(
  "keyup",
  (ev) => {
    const keys = keysFor(ev);
    if (keys === " ") {
      ev.preventDefault();
      app.ports.preventedKeyup.send(" ");
    }
  },
  false,
);

// -------------------------------------------------
// mouse
// -------------------------------------------------

window.addEventListener("mousemove", () => {
  app.ports.mouseMoved.send(null);
});

// -------------------------------------------------
// scrolling
// -------------------------------------------------

function debounce(f, wait) {
  let timeoutId = null;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => f(...args), wait);
  };
}

const scrollToSelected = debounce(() => {
  const selected = document.querySelector(".selected");
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

app.ports.scrollToSelected.subscribe(scrollToSelected);
