package deck

// Filter func
func (deck *Deck) Filter(cutoff string) *Deck {
	result := *deck
	result.Cards = nil
	for _, card := range deck.Cards {
		if card.DueOn <= cutoff {
			result.Cards = append(result.Cards, card)
		}
	}
	return &result
}
