package server

import (
	"fmt"
	"os"
	"time"

	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/jpalardy/memora/deck"
	"github.com/markbates/pkger"
)

type Server struct {
	Filenames []string
	AssetsDir string
	Styles    []string
}

// AddRoutesTo func
func (s Server) AddRoutesTo(router *gin.Engine) {
	if s.AssetsDir == "" {
		tmpl, err := getIndexTemplate()
		if err != nil {
			panic(err)
		}
		router.SetHTMLTemplate(tmpl)
		router.GET("/", s.getIndex)
		router.Use(static.Serve("/", &binaryFileSystem{fs: pkger.Dir("/public")}))
	} else {
		fmt.Println("*** using assets from:", s.AssetsDir)
		router.Use(static.Serve("/", static.LocalFile(s.AssetsDir, false)))
	}
	if len(s.Styles) > 0 {
		pwd, err := os.Getwd()
		if err != nil {
			panic(err)
		}
		router.Use(static.Serve("/", static.LocalFile(pwd, false)))
	}
	router.GET("/decks.json", s.getDecks)
	router.POST("/decks", s.postDecks)
}

//-------------------------------------------------

func (s Server) getIndex(c *gin.Context) {
	c.HTML(200, "index.html", gin.H{
		"styles": s.Styles,
	})
}

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
