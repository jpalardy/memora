
GOPATH ?= $(shell pwd)
export GOPATH

VERSION = $(shell git describe --tags)

all: install

install:
	go install -ldflags "-X main.ASSETS_DIR=$$PWD/assets -X main.VERSION=$(VERSION)-devel" memora

clean:
	rm -rf bin/ pkg/

