# refactor

## issue-target-value-duplicated — 既定値 20 が reference.md と SKILL.md に二重記載

- meta: origin: llm / status: open / 起票: 2026-08-09
- 内容: `issue_target` の既定値 20 が、reference.md の config 例と extract-issues/SKILL.md の
  本文の両方に数値で書かれている。reference.md は自分で「値の再記載はしない」（ディレクトリ体系節）
  という原則を掲げているのに、`issue_target` ではそれを破っている。既定値を変えるときに
  片方だけ直る事故が起きる。
- 根拠: plugins/distillation/reference.md:65（`issue_target: 20`）、
  plugins/distillation/reference.md:39（「config で上書きできるが、値の再記載はしない」）、
  plugins/distillation/skills/extract-issues/SKILL.md:30（「全レイヤー合計 20 件」）
- 提案（任意）: SKILL.md 側から数値を落として `config の issue_target（既定値は reference.md）` と
  参照だけにする。既定値の正本は reference.md に一本化する。
- 対応方針（ユーザー記入欄）:

## plugin-description-duplicated — description が marketplace.json と plugin.json で完全重複

- meta: origin: llm / status: open / 起票: 2026-08-09
- 内容: marketplace エントリと plugin マニフェストの `description` が 1 文字も違わない同じ文字列。
  `strict: true`（既定）では plugin.json が権威なので marketplace 側は無くても動く。
  片方だけ更新すると `/plugin` の表示と実体がずれる。
- 根拠: .claude-plugin/marketplace.json:13、plugins/distillation/.claude-plugin/plugin.json:6
  （両者が同一であることを確認済み）
- 提案（任意）: marketplace.json 側の `description` を削って plugin.json に一本化する。
  カタログ一覧に短い要約を出したいなら、意図的に別の（短い）文言にする。
- 対応方針（ユーザー記入欄）:

## readme-ci-sample-version-drift — README の CI サンプルと自リポジトリの workflow で action の版が違う

- meta: origin: llm / status: open / 起票: 2026-08-09
- 内容: README の「CI でスキルを走らせる」サンプルは `actions/checkout@v6`、このリポジトリ自身の
  workflow は `@v7`。同じ README 内に 2 つの版が並んでいる状態で、利用者にどちらを勧めているのか
  読み取れない。
- 根拠: README.md:222（`actions/checkout@v6`）、.github/workflows/validate.yml:12（`@v7`）
- 提案（任意）: README のサンプルを `@v7` に揃える。以後ずれないよう、サンプルを
  workflow から引用する形にするか、CI サンプルの版を定期更新の対象に含める。
- 対応方針（ユーザー記入欄）:

## reference-loaded-wholesale — 4 スキルが共有 reference.md を丸ごと読む

- meta: origin: llm / status: open / 起票: 2026-08-09
- 内容: 各 SKILL.md が冒頭で「先に reference.md を読む」と指示するため、どのスキルを起動しても
  reference.md 全体（約 210 行）が読み込まれる。実際には `extract-rules` はタグ文法を使わず、
  `grep-issues` は課題票の書式もモードも使わない。スキルを 4 つに割って on-invoke コストを
  下げた効果を、共有ファイルの丸読みで一部打ち消している。
- 根拠: plugins/distillation/skills/*/SKILL.md:9（各スキル冒頭の「先に reference.md を読む」）、
  plugins/distillation/reference.md（210 行・全節が 1 ファイル）
- 提案（任意）: 各 SKILL.md の指示を「reference.md の <必要な節> を読む」と節指定にする。
  効果が足りなければ reference.md を用途別（原則・体系 / 課題票とタグ文法）に分割して
  必要な側だけ symlink する。
- 対応方針（ユーザー記入欄）: