MARKETPLACE := sasano8-skills
# FIXME: [distill:makefile-plugins-wildcard-matches-files]: ディレクトリだけを拾うようにする
#   詳細: 現状は plugins/ 直下のファイルも拾うため、README 等を 1 つ置くと validate が壊れる。
#   codex-link の plugins/*/skills/* も同様。
PLUGINS     := $(notdir $(wildcard plugins/*))
PLUGIN      ?= distillation
SCOPE       ?= user
REMOTE      ?= origin
# Codex のスキルディレクトリ
SKILLS_DIR  ?= $(HOME)/.agents/skills
# Claude のスキルディレクトリ（@skills-dir として その場で読まれる）
CLAUDE_SKILLS_DIR ?= $(HOME)/.claude/skills

.DEFAULT_GOAL := help
.NOTPARALLEL:

.PHONY: help
help: ## このヘルプを表示
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  変数: PLUGIN=$(PLUGIN)  SCOPE=$(SCOPE)  REMOTE=$(REMOTE)"
	@echo "        SKILLS_DIR=$(SKILLS_DIR)"
	@echo "        CLAUDE_SKILLS_DIR=$(CLAUDE_SKILLS_DIR)"

.PHONY: validate
# TODO: [distill:validate-misses-unregistered-plugin]: plugins/ の実体と marketplace.json の source 集合を突き合わせる
#   詳細: 登録し忘れ / 実体の欠落のどちらも現状は検出できず、CI が緑のまま利用者に届かない。
validate: ## marketplace と全プラグインのマニフェストを検証
	@claude plugin validate . --strict
	@for p in $(PLUGINS); do claude plugin validate ./plugins/$$p --strict || exit 1; done

.PHONY: install
install: uninstall-dev ## このリポジトリをローカル marketplace として登録し PLUGIN をインストール
	claude plugin marketplace add $(CURDIR)
	claude plugin install $(PLUGIN)@$(MARKETPLACE) --scope $(SCOPE)

.PHONY: update
update: ## marketplace のカタログを取り直す
	claude plugin marketplace update $(MARKETPLACE)

.PHONY: uninstall
# REJECT: [distill:make-uninstall-drops-shared-marketplace]: install が marketplace 全体を登録する以上、uninstall が全体を外すのは対称で一貫している
uninstall: uninstall-dev uninstall-copy ## PLUGIN の導入をすべて外す（コピー形式・symlink の両方）

.PHONY: install-dev
install-dev: claude-link codex-link ## Claude と Codex の両方へ symlink する（コピーせず即反映＝開発用）

.PHONY: uninstall-dev
uninstall-dev: claude-unlink codex-unlink ## Claude・Codex の symlink だけを外す（コピーは残す）

.PHONY: claude-link
claude-link: uninstall-copy claude-unlink ## PLUGIN を Claude のスキルディレクトリへ symlink（コピーせず即反映＝開発用）
	@mkdir -p $(CLAUDE_SKILLS_DIR)
	@ln -sfn $(CURDIR)/plugins/$(PLUGIN) $(CLAUDE_SKILLS_DIR)/$(PLUGIN) \
		&& echo "link  $(CLAUDE_SKILLS_DIR)/$(PLUGIN)  ($(PLUGIN)@skills-dir)"

.PHONY: uninstall-copy
uninstall-copy: ## コピー形式だけを外す（プラグイン・marketplace 登録・settings の記述）
	@claude plugin uninstall $(PLUGIN)@$(MARKETPLACE) 2>/dev/null || echo "skip  コピー版は未インストール"
	@claude plugin marketplace remove $(MARKETPLACE) 2>/dev/null || echo "skip  marketplace は未登録"
	@node scripts/forget-marketplace.mjs $(MARKETPLACE)

.PHONY: claude-unlink
claude-unlink: ## Claude のスキルディレクトリから、このリポジトリを指す symlink を外す
	@for l in $(CLAUDE_SKILLS_DIR)/*; do \
		[ -L "$$l" ] || continue; \
		case "$$(readlink "$$l")" in "$(CURDIR)"/*) rm "$$l" && echo "unlink $$l";; esac; \
	done

.PHONY: tag-dryrun
tag-dryrun: validate ## 打たれるタグ名を確認するだけ（何も作らない）
	claude plugin tag ./plugins/$(PLUGIN) --dry-run

.PHONY: tag
tag: validate ## plugin.json の version で release タグを打つ（PUSH=1 で REMOTE へ push まで）
	claude plugin tag ./plugins/$(PLUGIN) $(if $(PUSH),--push --remote $(REMOTE),)

.PHONY: codex-link
codex-link: codex-unlink ## 全スキルを Codex のスキルディレクトリへ symlink する
	@mkdir -p $(SKILLS_DIR)
	@for s in plugins/*/skills/*; do \
		ln -sfn $(CURDIR)/$$s $(SKILLS_DIR)/$$(basename $$s) && echo "link  $(SKILLS_DIR)/$$(basename $$s)"; \
	done

.PHONY: codex-unlink
codex-unlink: ## Codex のスキルディレクトリから、このリポジトリを指す symlink を外す
	@for l in $(SKILLS_DIR)/*; do \
		[ -L "$$l" ] || continue; \
		case "$$(readlink "$$l")" in "$(CURDIR)"/*) rm "$$l" && echo "unlink $$l";; esac; \
	done