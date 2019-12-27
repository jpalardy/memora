package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"

	"github.com/gin-gonic/gin"
	"github.com/jpalardy/memora/server"
)

var VERSION = "???" // set externally by "go build"

type config struct {
	filenames []string
	port      int32
	assetsDir string
}

func run(config config) {
	// default to "release" unless env override
	ginMode, ok := os.LookupEnv(gin.EnvGinMode)
	if !ok {
		ginMode = gin.ReleaseMode
	}
	gin.SetMode(ginMode)

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	s := server.Server{Filenames: config.filenames, AssetsDir: config.assetsDir}
	s.AddRoutesTo(router)

	addr := fmt.Sprintf("127.0.0.1:%d", config.port)
	if err := router.Run(addr); err != nil {
		panic(err)
	}
}

func main() {
	config := config{
		port: 4567,
	}

	version := flag.Bool("version", false, "print version information")
	flag.Parse()
	config.filenames = flag.Args()

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

	run(config)
}
