package server

import (
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
	"time"

	"github.com/jpalardy/memora/deck"
)

type Server struct {
	Filenames   []string
	AssetsDir   string
	Styles      []string
	StaticFiles fs.FS
}

func (s *Server) NewHandler() http.Handler {
	mux := http.NewServeMux()

	if s.AssetsDir == "" {
		mux.Handle("/", overlay(http.FS(s.StaticFiles)))
	} else {
		log.Printf("*** using assets from: %s", s.AssetsDir)
		mux.Handle("/", overlay(http.Dir(s.AssetsDir)))
	}

	mux.HandleFunc("/styles.json", s.getStyles)
	mux.HandleFunc("/decks.json", s.getDecks)
	mux.HandleFunc("/decks", s.postDecks)

	return logRequest(mux)
}

//-------------------------------------------------

func (s Server) getDecks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	today := time.Now().Format("2006-01-02")
	decks := make([]deck.ClientDeck, 0, len(s.Filenames))

	for _, filename := range s.Filenames {
		d, err := deck.Read(filename)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		decks = append(decks, d.Filter(today).ToClient())
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(decks)
}

func (s Server) postDecks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var updates []deck.Update

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&updates); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := deck.UpdateFromClient(updates); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (s Server) getStyles(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s.Styles)
}
