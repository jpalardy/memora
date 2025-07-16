package main

import (
	"embed"
	"io/fs"

	"github.com/jpalardy/memora/cmd"
)

//go:embed web/public
var publicFiles embed.FS

func main() {
	staticFiles, _ := fs.Sub(publicFiles, "web/public")
	cmd.Execute(staticFiles)
}
