MARKETPLACE := sasano8-skills
PLUGINS     := $(notdir $(wildcard plugins/*))
PLUGIN      ?= distillation
SCOPE       ?= user
REMOTE      ?= origin
SKILLS_DIR  ?= $(HOME)/.agents/skills

.DEFAULT_GOAL := help

.PHONY: help
help: ## このヘルプを表示
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  変数: PLUGIN=$(PLUGIN)  SCOPE=$(SCOPE)  REMOTE=$(REMOTE)  SKILLS_DIR=$(SKILLS_DIR)"

.PHONY: validate
validate: ## marketplace と全プラグインのマニフェストを検証
	@claude plugin validate . --strict
	@for p in $(PLUGINS); do claude plugin validate ./plugins/$$p --strict || exit 1; done

.PHONY: dev
dev: ## PLUGIN を直接読ませて Claude Code を起動（marketplace を経由しない）
	claude --plugin-dir ./plugins/$(PLUGIN)

.PHONY: install
install: ## このリポジトリをローカル marketplace として登録し PLUGIN をインストール
	claude plugin marketplace add $(CURDIR)
	claude plugin install $(PLUGIN)@$(MARKETPLACE) --scope $(SCOPE)

.PHONY: update
update: ## marketplace のカタログを取り直す
	claude plugin marketplace update $(MARKETPLACE)

.PHONY: uninstall
uninstall: ## PLUGIN をアンインストールし marketplace の登録を外す
	-claude plugin uninstall $(PLUGIN)@$(MARKETPLACE)
	claude plugin marketplace remove $(MARKETPLACE)

.PHONY: tag-dryrun
tag-dryrun: validate ## 打たれるタグ名を確認するだけ（何も作らない）
	claude plugin tag ./plugins/$(PLUGIN) --dry-run

.PHONY: tag
tag: validate ## plugin.json の version で release タグを打つ（PUSH=1 で REMOTE へ push まで）
	claude plugin tag ./plugins/$(PLUGIN) $(if $(PUSH),--push --remote $(REMOTE),)

.PHONY: codex-link
codex-link: ## 全スキルを Codex のスキルディレクトリへ symlink する
	@mkdir -p $(SKILLS_DIR)
	@for s in plugins/*/skills/*; do \
		ln -sfn $(CURDIR)/$$s $(SKILLS_DIR)/$$(basename $$s) && echo "link  $(SKILLS_DIR)/$$(basename $$s)"; \
	done

.PHONY: codex-unlink
codex-unlink: ## codex-link で張った symlink を外す
	@for s in plugins/*/skills/*; do \
		l=$(SKILLS_DIR)/$$(basename $$s); \
		if [ -L "$$l" ]; then rm "$$l" && echo "unlink $$l"; fi; \
	done