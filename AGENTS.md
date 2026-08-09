# sasano8-skills

Claude Code のプラグイン marketplace。`plugins/<name>/` が各プラグインの実体で、
`.claude-plugin/marketplace.json` がカタログ。全体像は [README.md](README.md) を参照。

## 定形コマンド

```sh
make validate      # marketplace と全プラグインのマニフェスト・SKILL.md を検証（--strict）
make install-dev   # Claude と Codex の両方へ symlink（開発用）
make uninstall     # 導入をすべて外す（settings.json の取り残しも掃除する）
```

`make` で一覧。対象プラグインは `PLUGIN=<name>`（既定 `distillation`）。

## 編集するときの注意

- **スキルの共通定義は `plugins/<plugin>/reference.md` が正本。** 各 `SKILL.md` は自分の手順だけを
  持ち、共通部分を再記載しない。値（既定値・書式）を SKILL.md 側へ写さないこと。
- **`skills/*/reference.md` は symlink**（`../../reference.md`）。実体は 1 つ。編集は実体側へ。
  複製に置き換えないこと（理由は README の「スキル間で定義を共有する（symlink 方式）」）。
- **`SKILL.md` の `description` は起動判定にそのまま使われる。** パスや責務を変えたら description も
  合わせる。ここだけが常時コンテキストに載る。
- **SKILL.md に特定エージェント固有の変数を書かない**（`${CLAUDE_PLUGIN_ROOT}` 等）。
  Codex など他エージェントへそのまま流用できる状態を保つ。
- `plugin.json` の `version` を上げたときだけ利用者に更新が届く。リリースのたびに bump する。

## 課題管理

このリポジトリの課題管理は distillation で行う（quality の監査もこの宣言を見て先送り課題を起票する）:

issue-tracking: distillation/track-issues

## 作業領域

プラグインごとの作業領域は `workspaces/<plugin>/<target>/` で管理する。`distillation` の成果物・課題票は
`workspaces/distillation/<target>/` に置く。

`workspaces/<skill>/` はスキル共通の作業場置き場で、既定の場所なので
`distillation-workspace:` の宣言は置いていない — 場所は探索で解決される。

プラグイン実体の `plugins/distillation/` とは別物なので取り違えないこと。