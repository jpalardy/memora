package main

import "encoding/json"
import "io/ioutil"
import "flag"
import "fmt"
import "net/http"
import "os"
import "os/signal"
import "time"

import "github.com/jpalardy/memora/deck"

func check(err error) {
	if err != nil {
		panic(err)
	}
}

var VERSION = "???"    // set externally by "go build"
var ASSETS_DIR = "???" // set externally by "go build"

func serve(filenames []string, port string, assets_dir string) {
	// GET /decks.json
	http.HandleFunc("/decks.json", func(rw http.ResponseWriter, r *http.Request) {
		fmt.Println("-->", r.URL.Path)
		today := time.Now().Format("2006-01-02")
		var decks []deck.ClientDeck
		for _, filename := range filenames {
			d, err := deck.Read(filename)
			check(err)
			decks = append(decks, *d.Filter(today).ToClient())
		}
		js, err := json.Marshal(decks)
		check(err)
		rw.Header().Set("Content-Type", "application/json")
		rw.Write(js)
	})

	// POST /decks
	http.HandleFunc("/decks", func(rw http.ResponseWriter, r *http.Request) {
		fmt.Println("-->", r.URL.Path)
		body, err := ioutil.ReadAll(r.Body)
		check(err)
		err = deck.UpdateFromClient(body)
		check(err)
		rw.WriteHeader(200)
	})

	// all other requests, try to serve from assets_dir
	http.Handle("/", http.FileServer(http.Dir(assets_dir)))

	address := "127.0.0.1:" + port
	fmt.Println("listening on http://" + address)
	err := http.ListenAndServe(address, nil)
	check(err)
}

func main() {
	port := flag.String("port", "4567", "port to listen on")
	assets_dir := flag.String("assets", ASSETS_DIR, "directory where the assets (html, css, javascript) are located")
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

	serve(filenames, *port, *assets_dir)
}
