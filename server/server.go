package server

import (
	"fmt"
	"time"

	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/jpalardy/memora/deck"
	"github.com/markbates/pkger"
)

type Server struct {
	Filenames []string
	AssetsDir string
}

// AddRoutesTo func
func (s Server) AddRoutesTo(router gin.IRoutes) {
	if s.AssetsDir == "" {
		router.Use(static.Serve("/", &binaryFileSystem{fs: pkger.Dir("/public")}))
	} else {
		fmt.Println("*** using assets from:", s.AssetsDir)
		router.Use(static.Serve("/", static.LocalFile(s.AssetsDir, false)))
	}
	router.GET("/decks.json", s.getDecks)
	router.POST("/decks", s.postDecks)
}

//-------------------------------------------------

func (s Server) getDecks(c *gin.Context) {
	today := time.Now().Format("2006-01-02")
	decks := make([]deck.ClientDeck, 0, len(s.Filenames))
	for _, filename := range s.Filenames {
		d, err := deck.Read(filename)
		if err != nil {
			c.String(500, err.Error())
			return
		}
		decks = append(decks, d.Filter(today).ToClient())
	}
	c.JSON(200, decks)
}

func (s Server) postDecks(c *gin.Context) {
	var updates []deck.Update
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.String(400, "Invalid JSON")
		return
	}
	if err := deck.UpdateFromClient(updates); err != nil {
		c.String(500, err.Error())
		return
	}
}
