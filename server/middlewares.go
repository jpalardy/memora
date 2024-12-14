package server

import (
	"log"
	"net/http"
)

func overlay(primary http.FileSystem, debug bool) http.HandlerFunc {
	primaryFSHandler := logRequest(http.FileServer(primary).ServeHTTP, debug)
	secondaryFSHandler := logRequest(http.FileServer(http.Dir(".")).ServeHTTP, true)

	return func(w http.ResponseWriter, r *http.Request) {
		f, err := primary.Open(r.URL.Path)
		if err == nil {
			f.Close()
			primaryFSHandler(w, r)
			return
		}
		secondaryFSHandler(w, r)
	}
}

func logRequest(next http.HandlerFunc, debug bool) http.HandlerFunc {
	if debug == false {
		return next
	}
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.String())
		next.ServeHTTP(w, r)
	}
}
