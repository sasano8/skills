# bug

## make-uninstall-drops-shared-marketplace — PLUGIN を指定しても marketplace 登録ごと消える

- meta: origin: llm / status: open / 起票: 2026-08-09
- 内容: `make uninstall` は `PLUGIN` 単位のつもりで呼べるが、最後に
  `claude plugin marketplace remove $(MARKETPLACE)` を無条件で実行する。marketplace 登録は
  リポジトリ全体で 1 つなので、プラグインが 2 つ以上になった時点で
  `make uninstall PLUGIN=a` が b のインストール元まで消す。Claude Code は marketplace を
  removeするとそこから入れたプラグインをすべて uninstall するため、b も巻き添えで消える。
  現在プラグインが 1 つなので顕在化していない。
- 根拠: Makefile:42-44（`uninstall` の recipe が `PLUGIN` に依存しない `marketplace remove` を含む）、
  Makefile:2（`PLUGINS := $(notdir $(wildcard plugins/*))` は複数プラグインを前提にしている）
- 提案（任意）: `marketplace remove` を `uninstall` から外して独立ターゲット（例 `unregister`）にする。
  または残りプラグインが 0 件のときだけ remove する。
- 対応方針（ユーザー記入欄）:

## makefile-plugins-wildcard-matches-files — plugins/ 直下のファイルを PLUGINS が拾う

- meta: origin: llm / status: open / 起票: 2026-08-09
- 内容: `PLUGINS := $(notdir $(wildcard plugins/*))` はディレクトリに限定していない。
  `plugins/README.md` のようなファイルを 1 つ置くだけで `make validate` が
  `claude plugin validate ./plugins/README.md` を実行して失敗する。同様に `codex-link` の
  `plugins/*/skills/*` も、スキル以外のファイルを置くとリンク対象に混ざる。
- 根拠: Makefile:2、Makefile:57-59（`for s in plugins/*/skills/*`）
- 提案（任意）: `$(wildcard plugins/*/.)` か `$(patsubst plugins/%/,%,$(wildcard plugins/*/))` で
  ディレクトリだけを拾う。
- 対応方針（ユーザー記入欄）: