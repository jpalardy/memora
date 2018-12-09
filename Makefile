
VERSION = $(shell git describe --tags)

install:
	go install -ldflags "-X main.ASSETS_DIR=$$PWD/assets -X main.VERSION=$(VERSION)-devel"

