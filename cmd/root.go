package cmd

import (
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"

	"github.com/jpalardy/memora/server"
	"github.com/spf13/cobra"
)

var VERSION = "???" // set externally by "go build"

type config struct {
	filenames   []string
	port        int32
	assetsDir   string
	styles      []string
	staticFiles fs.FS
}

func run(config config) {
	s := server.Server{
		Filenames:   config.filenames,
		AssetsDir:   config.assetsDir,
		Styles:      config.styles,
		StaticFiles: config.staticFiles,
		Debug:       os.Getenv("DEBUG") == "true",
	}
	mux := s.NewHandler()

	// normal exit on ctrl-c
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	go func() {
		<-c
		os.Exit(0)
	}()

	addr := fmt.Sprintf("127.0.0.1:%d", config.port)
	log.Printf("serving on http://%s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		panic(err)
	}
}

// Execute runs the rootCmd
func Execute(staticFiles fs.FS) {
	config := config{
		staticFiles: staticFiles,
	}
	rootCmd := &cobra.Command{
		Use:   "memora [filenames]",
		Short: "memora is spaced repetition flashcard app",
		Args:  cobra.MinimumNArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			config.filenames = args
			run(config)
		},
	}
	rootCmd.PersistentFlags().Int32VarP(&config.port, "port", "p", 4567, "port to serve from")
	rootCmd.PersistentFlags().StringVar(&config.assetsDir, "assets", "", "override dir for static assets (HTML, CSS, JS...)")
	rootCmd.PersistentFlags().StringSliceVar(&config.styles, "style", make([]string, 0), "custom css filename")
	rootCmd.Version = VERSION

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
