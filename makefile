# Tools installed locally into repo, don't change
TOOL_DIR := .tools/
BS_PATH := .tools/node_modules/.bin/browser-sync
ESLINT_PATH := .tools/node_modules/.bin/eslint
PRETTIER_PATH := .tools/node_modules/.bin/prettier

.EXPORT_ALL_VARIABLES:
.PHONY: help lint install-tools
.DEFAULT_GOAL := help

help: ## 💬 This help message :)
	@figlet $@ || true
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(firstword $(MAKEFILE_LIST)) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install-tools: ## 🔮 Install dev tools into local project directory
	@figlet $@ || true
	@node --version > /dev/null 2>&1 || { echo "💥 Node.js is not installed, goodbye!"; exit 1; }	
	@$(BS_PATH) --version > /dev/null 2>&1 || npm install --prefix $(TOOL_DIR) browser-sync
	@$(ESLINT_PATH) -v > /dev/null 2>&1 || npm install --prefix $(TOOL_DIR) eslint
	@$(PRETTIER_PATH) -v > /dev/null 2>&1 || npm install --prefix $(TOOL_DIR) prettier
	@$(JSDOC_PATH) -v > /dev/null 2>&1 || npm install --prefix $(TOOL_DIR) jsdoc

serve: ## 🌐 Run with dev HTTP server & hot-reload
	@figlet $@ || true
	@$(BS_PATH) start -s . --no-ui --watch --no-notify

docs: ## 📚 Generate documentation
	@figlet $@ || true
	@$(JSDOC_PATH) -c .jsdoc.json -d docs