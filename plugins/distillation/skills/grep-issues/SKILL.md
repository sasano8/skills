---
name: grep-issues
type: func
description: 対象プロジェクトのソースと TODO.md を TODO / FIXME / REJECT で grep し、distill タグ付きの課題（採用 / 保留 / 却下）と手書きの未了作業を一覧表示する。あわせて workspaces/distillation/<target>/issue/ に残る open の課題票を併記して、方針待ちを可視化する。read-only で何も書き換えない。ユーザーが「課題を列挙」「課題を一覧」「TODO を一覧」「今どんなタグがあるか」「未了作業を見せて」「distill タグを確認」等を求めたときに使う。プロジェクト非依存。
---

<!-- TODO: [distill:skill-frontmatter-type-undocumented]: frontmatter の `type: func` を削る（5 スキル共通） -->

# grep-issues — ソースのタグと課題票を一覧する

**先に同じディレクトリの [`reference.md`](reference.md) を読む。** ディレクトリ体系・config と scope・
タグ文法・タグの列挙（grep 仕様）はそちらが正本で、ここには書かない（タグ文法・タグの列挙は
`track-issues` が司る規定）。

**read-only。起票もマージもしない・何も書き換えない。** 書き込みが必要になったら、このスキルでは
やらずに `extract-issues`（起票）か `merge-issues`（転記）へ渡す。

## 手順

1. **scope 確定** — `reference.md`「config と scope」のとおり config を読む。config が無ければ
   scope を推定して一覧を出すだけに留める（read-only なので仮 config も書かない）。
2. **grep** — `reference.md`「タグの列挙（grep 仕様）」のとおり、scope.code（exclude 適用）と
   `TODO.md`（あれば）を `TODO:|FIXME:|REJECT:` で走査する。
3. **提示** — 次の 3 つを区別して並べる:
   - `[distill:<slug>...]` 付き — このスキル群経由の課題（採用 / 保留 / 却下と修飾子を添える）
   - タグ無しの素の `TODO:` / `FIXME:` — 手書きの未了作業（全体像として併せて出す）
   - `issue/` に残る open の課題票 — まだソースへ還っていない＝方針待ち

## 次にやること

- open の課題票があり、対応方針が記入済みなら `merge-issues` を提案する。
- ソースにも課題票にも何も無い、あるいは前回の抽出から時間が経っているなら `extract-issues` を提案する。