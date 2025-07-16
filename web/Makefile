
ELMs = $(wildcard src/*.elm)
OUTPUT = public/js/app.js

# -------------------------------------------------

.PHONY: build
build: $(ELMs)
	npm exec -- elm make --debug src/Main.elm --output $(OUTPUT)

optimize: $(ELMs)
	npm exec -- elm make src/Main.elm --optimize --output $(OUTPUT)
	npm exec -- uglifyjs $(OUTPUT) --compress 'pure_funcs=[F2,F3,F4,F5,F6,F7,F8,F9,A2,A3,A4,A5,A6,A7,A8,A9],pure_getters,keep_fargs=false,unsafe_comps,unsafe' | npm exec -- uglifyjs --mangle --output public/js/app.js

.PHONY: watch
watch:
	ls $(ELMs) | entr -c -s 'ding make -s'

.PHONY: test
test:
	npm exec -- elm-test

.PHONY: clean
clean:
	rm -rf elm-stuff/ $(OUTPUT)

.PHONE: deep-clean
deep-clean: clean
	rm -rf node_modules/

