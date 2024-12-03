package server

import (
	"log"
	"net/http"
)

func overlay(primary http.FileSystem) http.Handler {
	primaryFS := http.FileServer(primary)
	secondaryFS := http.FileServer(http.Dir("."))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		f, err := primary.Open(r.URL.Path)
		if err == nil {
			f.Close()
			primaryFS.ServeHTTP(w, r)
			return
		}
		secondaryFS.ServeHTTP(w, r)
	})
}

func logRequest(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.String())
		next.ServeHTTP(w, r)
	})
}
