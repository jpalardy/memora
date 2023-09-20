package server

import (
	"html/template"
	"net/http"
	"strings"
)

// copied from github.com/gin-contrib/static/example/bindata/example.go

type binaryFileSystem struct {
	fs http.FileSystem
}

func (b *binaryFileSystem) Open(name string) (http.File, error) {
	return b.fs.Open(name)
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

func (b *binaryFileSystem) getIndexTemplate() (*template.Template, error) {
	file, err := b.fs.Open("/index.html")
	if err != nil {
		return nil, err
	}
	defer file.Close()

	bytes := make([]byte, 1000)
	_, err = file.Read(bytes)
	if err != nil {
		return nil, err
	}

	return template.New("index.html").Parse(string(bytes))
}
