
all: help

install:
	npm ci

publish:
	npm publish --dry-run

build:
	npm run build

serve:
	npx webpack serve

lint:
	npx eslint .
