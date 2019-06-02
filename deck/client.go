package deck

import (
	"strconv"
	"time"
)

type clientCard struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
	Last     string `json:"last,omitempty"`
}

// ClientDeck struct
type ClientDeck struct {
	Filename    string       `json:"filename"`
	ClientCards []clientCard `json:"cards"`
}

//-------------------------------------------------

type cardUpdate struct {
	Mark int    `json:"mark"`
	Next string `json:"next"`
}

// Update struct
type Update struct {
	Filename string                `json:"filename"`
	Updates  map[string]cardUpdate `json:"updates"`
}

//-------------------------------------------------

// ToClient func
func (deck Deck) ToClient() ClientDeck {
	result := ClientDeck{Filename: deck.Filename}
	for _, card := range deck.Cards {
		var last string
		if len(card.History) > 0 {
			last = card.History[len(card.History)-1].Date
		}
		result.ClientCards = append(result.ClientCards, clientCard{
			Question: card.Question,
			Answer:   card.Answer,
			Last:     last,
		})
	}
	return result
}

// UpdateFromClient func
func UpdateFromClient(updates []Update) error {
	for _, update := range updates {
		deck, err := Read(update.Filename)
		if err != nil {
			return err
		}
		err = deck.update(update.Updates)
		if err != nil {
			return err
		}
	}
	return nil
}

func (deck *Deck) update(updates map[string]cardUpdate) error {
	today := time.Now().Format("2006-01-02")
	for i := range deck.Cards {
		card := &deck.Cards[i]
		if cu, ok := updates[card.Question]; ok {
			card.DueOn = cu.Next
			card.History = append(card.History, answer{Date: today, Mark: strconv.Itoa(cu.Mark)})
		}
	}
	return deck.Write()
}
