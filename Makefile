
VERSION = $(shell git describe --tags)

.PHONY: build
build:
	go build -ldflags "-X github.com/jpalardy/memora/cmd.VERSION=$(VERSION)-devel" -o bin/memora

.PHONY: lint
lint:
	golangci-lint run --enable-all

.PHONY: clean
clean:
	rm -rf bin/

