/* global React, Scheduler, ACTIONS, TODAY, mouseSelectionAllowed */

var utils = {
  pluralize: function (count, singular, plural) {
    plural = plural || singular + 's';
    return count + " " + (count === 1 ? singular : plural);
  },
};

var elem = React.createElement;

//-------------------------------------------------

var Card = React.createClass({
  displayName: 'card',
  handleUp: function () {
    ACTIONS.flipCard(false);
  },
  handleDown: function () {
    ACTIONS.flipCard(true);
  },
  select: function () {
    if (!mouseSelectionAllowed) { return; }
    ACTIONS.selectCard(this.props.card);
  },
  render: function () {
    var card = this.props.card;
    var text = (card.flipped ? card.answer : card.question);
    var classNames = ['card'];
    if (card.selected) {
      classNames.push('selected');
    }
    if (card.mark !== undefined) {
      classNames.push(card.mark ? 'passed' : 'failed');
    }
    var preview = (function () {
      var minDays = Scheduler.daysPreview(card.last)[0];
      var maxDays = Scheduler.daysPreview(card.last)[1];
      return (minDays === 0 ? '1 day' : minDays + ".." + maxDays + " days");
    }());
    return (
      elem('div', {
        className:    classNames.join(' '),
        onMouseDown:  this.handleDown,
        onMouseUp:    this.handleUp,
        onMouseEnter: this.select,
      },
        elem('span', {className: 'text'}, text),
        elem('span', {className: 'preview'}, preview))
    );
  },
});

//-------------------------------------------------

var getLimit = function (limit, cards) {
  if (limit) {
    return limit;             // explicit limit
  }
  if (cards.length < 16) {    // tolerate 13..15
    return cards.length;
  }
  return 12;                  // default to 12 (soft)
};

var Deck = React.createClass({
  displayName: 'deck',
  getInitialState: function () {
    return {};
  },
  handleClick: function () {
    var limit = prompt('How many cards', getLimit(this.state.limit, this.props.deck.cards));
    limit = parseInt(limit, 10);
    if (!isNaN(limit)) {
      this.setState({limit: limit});
    }
  },
  render: function () {
    var cards = this.props.deck.cards;
    var subtext = utils.pluralize(cards.length, 'card');
    var limit = getLimit(this.state.limit, this.props.deck.cards);
    if (limit) {
      if (limit < cards.length) {
        subtext = limit + ' of ' + subtext;
      }
      cards = cards.slice(0, limit);
    }
    if (cards.length === 0) {
      return false;  // aka render "nothing"
    }
    var filename = this.props.deck.filename;
    var cardsHTML = cards.map(function (card) { return elem(Card, {card: card}); });
    return elem('div', {className: 'deck'},
      elem('hgroup', {onClick: this.handleClick},
        elem('h2', null, filename),
        elem('h3', {className: 'subtext'}, subtext)),
      elem('div', {className: 'cards'}, cardsHTML));
  },
});

//-------------------------------------------------

var Session = React.createClass({
  displayName: 'session',
  render: function () {
    var decksHTML = this.props.decks.map(function (deck) { return elem(Deck, {deck: deck}); });
    return elem('div', null, decksHTML);
  },
});
