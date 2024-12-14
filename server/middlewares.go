package server

import (
	"log"
	"net/http"
)

func overlay(primary http.FileSystem) http.HandlerFunc {
	primaryFS := http.FileServer(primary)
	secondaryFS := http.FileServer(http.Dir("."))

	return func(w http.ResponseWriter, r *http.Request) {
		f, err := primary.Open(r.URL.Path)
		if err == nil {
			f.Close()
			primaryFS.ServeHTTP(w, r)
			return
		}
		secondaryFS.ServeHTTP(w, r)
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
