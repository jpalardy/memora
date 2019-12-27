package server

import (
	"net/http"
	"strings"
)

// copied from github.com/gin-contrib/static/example/bindata/example.go

type binaryFileSystem struct {
	fs http.FileSystem
}

func (b *binaryFileSystem) Open(name string) (http.File, error) {
	return b.fs.Open("/" + name)
}

func (b *binaryFileSystem) Exists(prefix string, filepath string) bool {
	if p := strings.TrimPrefix(filepath, prefix); len(p) < len(filepath) {
		if _, err := b.fs.Open("/" + p); err != nil {
			return false
		}
		return true
	}
	return false
}
