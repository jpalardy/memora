package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/jpalardy/memora/deck"
)

var VERSION = "???"    // set externally by "go build"
var ASSETS_DIR = "???" // set externally by "go build"

func replyError(w http.ResponseWriter, err error) {
	fmt.Fprintln(os.Stderr, "*", err)
	http.Error(w, err.Error(), 500)
}

func serve(filenames []string, port string, assetsDir string) {
	// GET /decks.json
	http.HandleFunc("/decks.json", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("-->", r.URL.Path)
		today := time.Now().Format("2006-01-02")
		decks := make([]deck.ClientDeck, 0, len(filenames))
		for _, filename := range filenames {
			d, err := deck.Read(filename)
			if err != nil {
				replyError(w, err)
				return
			}
			decks = append(decks, d.Filter(today).ToClient())
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(decks)
	})

	// POST /decks
	http.HandleFunc("/decks", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("-->", r.URL.Path)
		var updates []deck.Update
		decoder := json.NewDecoder(r.Body)
		if err := decoder.Decode(&updates); err != nil {
			replyError(w, err)
			return
		}
		if err := deck.UpdateFromClient(updates); err != nil {
			replyError(w, err)
			return
		}
		w.WriteHeader(200)
	})

	// all other requests, try to serve from assetsDir
	http.Handle("/", http.FileServer(http.Dir(assetsDir)))

	address := "127.0.0.1:" + port
	fmt.Println("listening on http://" + address)
	err := http.ListenAndServe(address, nil)
	if err != nil {
		fmt.Fprintln(os.Stderr, "*", err)
		os.Exit(1)
	}
}

func main() {
	port := flag.String("port", "4567", "port to listen on")
	assetsDir := flag.String("assets", ASSETS_DIR, "directory where the assets (html, css, javascript) are located")
	version := flag.Bool("version", false, "print version information")
	flag.Parse()
	filenames := flag.Args()

	if *version {
		fmt.Println("memora", VERSION)
		os.Exit(0)
	}

	// normal exit on ctrl-c
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	go func() {
		<-c
		os.Exit(0)
	}()

	serve(filenames, *port, *assetsDir)
}
