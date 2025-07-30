
VERSION = $(shell git describe --tags)

.PHONY: build
build:
	make -C web optimize
	go build -ldflags "-X github.com/jpalardy/memora/cmd.VERSION=$(VERSION)-devel" -o bin/memora

.PHONY: build-macos
build-macos:
	env GOOS=darwin GOARCH=arm64 $(MAKE) build

.PHONY: lint
lint:
	golangci-lint run --enable-all

.PHONY: clean
clean:
	rm -rf bin/
	make -C web clean

.PHONY: purge
purge: clean
	make -C web purge


