/* global React, scheduler, ACTIONS, mouseSelectionAllowed, LIMITS, prompt, getLimit, pluralize */

const elem = React.createElement;

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

//-------------------------------------------------

const Deck = React.createClass({
  displayName: "deck",
  getInitialState() {
    return {};
  },
  handleClick() {
    let limit = prompt("How many cards", getLimit(LIMITS[this.props.deck.filename], this.props.deck.cards.length));
    limit = parseInt(limit, 10);
    if (!Number.isNaN(limit)) {
      LIMITS[this.props.deck.filename] = limit; // used in app.js
      this.setState({limit});
    }
  },
  render() {
    let {cards} = this.props.deck;
    let subtext = pluralize(cards.length, "card");
    const limit = getLimit(this.state.limit, this.props.deck.cards);
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

//-------------------------------------------------

const Session = React.createClass({
  displayName: "session",
  render() {
    const decksHTML = this.props.decks.map(deck => elem(Deck, {deck}));
    return elem("div", null, decksHTML);
  },
});
