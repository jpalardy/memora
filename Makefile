
GOPATH ?= $(shell pwd)

VERSION = $(shell git describe --tags)

all: install

install:
	GOPATH=$(GOPATH) go install -ldflags "-X main.ASSETS_DIR=$$PWD/assets -X main.VERSION=$(VERSION)-devel" github.com/jpalardy/memora

clean:
	rm -rf bin/ pkg/

