# sasano8-skills

Claude Code / Codex で共用する Agent Skills。Claude Code 向けにはプラグイン marketplace として配布する。
`plugins/<name>/` が各プラグインの実体で、
`.claude-plugin/marketplace.json` がカタログ。全体像は [README.md](README.md) を参照。

## 定形コマンド

```sh
make sync-references # 共有文書を各スキルへ一括コピー（コミット前に実行）
make validate      # コピーの同期・同期処理・marketplace・全プラグインを検証
make install-dev   # Claude と Codex の両方へ symlink（開発用）
make uninstall     # 導入をすべて外す（settings.json の取り残しも掃除する）
```

`make` で一覧。対象プラグインは `PLUGIN=<name>`（既定 `distillation`）。効くのは 1 プラグインを名指しする
ターゲット（`install-plugin` / `tag`）だけで、`install-dev` 系は Claude・Codex とも常に全プラグインを張る。

## エージェント間の共通化

- プロジェクト規約は `AGENTS.md` を正本とする。Claude Code 2.1.277 以降は、`CLAUDE.md` が
  無いプロジェクトで `AGENTS.md` を読む。旧版向けの橋渡しファイルは必要な利用先だけに置く。
- スキル本体は Agent Skills 形式の `SKILL.md` と共有 `reference.md` にまとめる。
  frontmatter は標準フィールドを使い、独自の `type: func` 等は追加しない。
- 配布・起動方法とベンダー固有メタデータは README・manifest・`agents/openai.yaml` に分ける。

## 編集するときの注意

- **スキルの共通定義は `plugins/<plugin>/reference.md` が正本。** 各 `SKILL.md` は自分の手順だけを
  持ち、共通部分を再記載しない。値（既定値・書式）を SKILL.md 側へ写さないこと。
- **`skills/*/reference.md` は生成物。直接編集しない。** 編集はプラグイン直下の正本へ行い、
  コミット前にトップレベルの `sync-references.mjs`（`make sync-references`）で全スキルへ一括反映する。
  生成物もコミットする。`make validate` と CI は未同期を失敗にする。
- 共有定義が不要なスキルは `SKILL.md` にまとめてよい。共通文書がないプラグインは同期対象外。
- **`SKILL.md` の `description` は起動判定にそのまま使われる。** パスや責務を変えたら description も
  合わせる。ここだけが常時コンテキストに載る。
- **SKILL.md に特定エージェント固有の変数を書かない**（`${CLAUDE_PLUGIN_ROOT}` 等）。
  Codex など他エージェントへそのまま流用できる状態を保つ。
- **ベンダー固有のファイルは、他エージェントで無害なら別ファイルとして持ってよい。**
  実際に持つのは `skills/<skill>/agents/openai.yaml`（Codex 用のメタデータ）で、**全スキルに置く**。
  Claude Code は `agents/` をプラグインのルート直下でしか読まないため、スキル内のこれは無視される
  ＝挙動に影響しない。禁止は SKILL.md 本文の方だけ（そこは全エージェント共通の正本なので混ぜない）。
- `plugin.json` の `version` を上げたときだけ利用者に更新が届く。リリースのたびに bump する。

## 課題管理

このリポジトリの課題管理は distillation で行う（quality の監査もこの宣言を見て先送り課題を起票する）:

issue-tracking: distillation/track-issues

## 作業領域

プラグインごとの作業領域は `workspaces/<plugin>/<target>/` で管理する。

| プラグイン | 置き場所 | 中身 |
| --- | --- | --- |
| `distillation` | `workspaces/distillation/<target>/` | 課題票・スキル草稿・config |
| `advisor` | `workspaces/advisor/<target>/` | 助言の成果物（`<skill>.md`。例 `ai_model.md`） |

`workspaces/<plugin>/` はスキル共通の作業場置き場で、どちらも既定の場所なので
`distillation-workspace:` / `advisor-workspace:` の宣言は置いていない — 場所は探索で解決される。

プラグイン実体の `plugins/distillation/`・`plugins/advisor/` とは別物なので取り違えないこと。