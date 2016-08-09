package deck

import "strings"
import "time"

import "github.com/jpalardy/par"

//-------------------------------------------------

type answer struct {
	Date string `json:"date"`
	Mark string `json:"mark"`
}

type card struct {
	Question string   `json:"question"`
	Answer   string   `json:"answer"`
	DueOn    string   `json:"dueOn"`
	History  []answer `json:"history"`
}

type Deck struct {
	Filename string `json:"filename"`
	Cards    []card `json:"cards"`
}

//-------------------------------------------------

func toString(h []answer) string {
	var answers []string
	for _, a := range h {
		aStr := a.Date + " " + a.Mark
		answers = append(answers, aStr)
	}
	return strings.Join(answers, ", ")
}

func (c card) toStringSlice() []string {
	result := []string{c.Question, c.Answer, c.DueOn}
	if len(c.History) > 0 {
		result = append(result, toString(c.History))
	}
	return result
}

//-------------------------------------------------

func newCard(args ...string) *card {
	result := card{Question: args[0], Answer: args[1]}
	if len(args) >= 3 {
		result.DueOn = args[2]
	} else {
		today := time.Now().Format("2006-01-02")
		result.DueOn = today
	}
	if len(args) >= 4 {
		parts := strings.Split(args[3], ", ")
		var history []answer
		for _, part := range parts {
			subparts := strings.Split(part, " ")
			history = append(history, answer{subparts[0], subparts[1]})
		}
		result.History = history
	}
	return &result
}

//-------------------------------------------------

func Read(filename string) (*Deck, error) {
	paragraphs, err := par.Read(filename)
	if err != nil {
		return nil, err
	}
	deck := Deck{Filename: filename}
	for _, par := range paragraphs {
		deck.Cards = append(deck.Cards, *newCard(par...))
	}
	return &deck, nil
}

func (deck *Deck) Write() error {
	var paragraphs [][]string
	for _, card := range deck.Cards {
		paragraphs = append(paragraphs, card.toStringSlice())
	}
	err := par.Write(deck.Filename, paragraphs)
	return err
}
