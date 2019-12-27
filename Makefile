
VERSION = $(shell git describe --tags)

.PHONY: build
build: pkged.go
	go build -ldflags "-X github.com/jpalardy/memora/cmd.VERSION=$(VERSION)-devel" -o bin/memora

pkged.go:
	pkger
	goimports -w pkged.go

.PHONY: lint
lint:
	golangci-lint run --enable-all

.PHONY: clean
clean:
	rm -rf bin/ pkged.go

