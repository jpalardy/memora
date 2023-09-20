package main

import (
	"embed"
	"io/fs"

	"github.com/jpalardy/memora/cmd"
)

//go:embed public
var publicFiles embed.FS

func main() {
	staticFiles, _ := fs.Sub(publicFiles, "public")
	cmd.Execute(staticFiles)
}
