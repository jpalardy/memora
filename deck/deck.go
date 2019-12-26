package deck

import (
	"fmt"
	"strings"
	"time"

	"github.com/jpalardy/memora/par"
)

//-------------------------------------------------

type answer struct {
	Date string `json:"date"`
	Mark string `json:"mark"`
}

type history []answer

func (h history) String() string {
	answers := make([]string, 0, len(h))
	for _, a := range h {
		answers = append(answers, fmt.Sprintf("%s %s", a.Date, a.Mark))
	}
	return strings.Join(answers, ", ")
}

//-------------------------------------------------

type card struct {
	Question string  `json:"question"`
	Answer   string  `json:"answer"`
	DueOn    string  `json:"dueOn"`
	History  history `json:"history"`
}

func (c card) Strings() []string {
	result := []string{c.Question, c.Answer, c.DueOn}
	if len(c.History) > 0 {
		result = append(result, c.History.String())
	}
	return result
}

//-------------------------------------------------

// Deck struct
type Deck struct {
	Filename string `json:"filename"`
	Cards    []card `json:"cards"`
}

//-------------------------------------------------

func cardFrom(args ...string) card {
	result := card{Question: args[0], Answer: args[1]}
	if len(args) >= 3 {
		result.DueOn = args[2]
	} else {
		today := time.Now().Format("2006-01-02")
		result.DueOn = today
	}
	if len(args) >= 4 {
		parts := strings.Split(args[3], ", ")
		history := make([]answer, 0, len(parts))
		for _, part := range parts {
			subparts := strings.Split(part, " ")
			history = append(history, answer{subparts[0], subparts[1]})
		}
		result.History = history
	}
	return result
}

//-------------------------------------------------

// Read func
func Read(filename string) (Deck, error) {
	paragraphs, err := par.Read(filename)
	if err != nil {
		return Deck{}, err
	}
	deck := Deck{Filename: filename}
	for _, par := range paragraphs {
		deck.Cards = append(deck.Cards, cardFrom(par...))
	}
	return deck, nil
}

func (deck Deck) Write() error {
	paragraphs := make([][]string, 0, len(deck.Cards))
	for _, card := range deck.Cards {
		paragraphs = append(paragraphs, card.Strings())
	}
	err := par.Write(deck.Filename, paragraphs)
	return err
}
