---
mode: confirm
issue_target: 20
scope:
  code:
    - plugins/
    - Makefile
    - .github/
    - .claude-plugin/
  docs:
    - README.md
    - plugins/distillation/README.md
  exclude:
    - workspaces/
    - .git/
updated: 2026-08-09
---

このリポジトリは「スキルそのもの」が成果物なので、`plugins/**/SKILL.md` と `reference.md` を
一次情報（コード）として扱う。`Makefile` / `.github/` / `.claude-plugin/` は配布・検証の実装なので
同じくコード側。README は docs だが、`plugins/distillation/README.md` はスキルの仕様説明を兼ねるため
矛盾を課題として拾う対象に含める。

初回実行（2026-08-09）で仮 config として生成。scope はユーザー未確認。

作業場は `.cache/distillation/` から `workspaces/distillation/` へ移動済み（2026-08-09、ユーザー判断）。
git に追跡させて、起票 → 方針決定 → マージの過程を履歴に残す。
`exclude` に `workspaces/` を入れているのは、作業場自身を読解対象にしないため
（課題票のテキストを新たな課題として拾ってしまうのを防ぐ）。
