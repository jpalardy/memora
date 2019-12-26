package deck

func (deck Deck) Filter(cutoff string) Deck {
	result := deck
	result.Cards = make([]card, 0, len(deck.Cards))
	for _, card := range deck.Cards {
		if card.DueOn <= cutoff {
			result.Cards = append(result.Cards, card)
		}
	}
	return result
}
