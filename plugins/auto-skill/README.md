# auto-skill

ガイドライン・設計指針・運用手順等から、対象リポジトリで使うスキルを生成・更新する。
Claude Code / Codex で共用する Agent Skills。詳細な規則は正本に残し、生成スキルには
起動条件、判断と作業の順序、必要な文書への参照をまとめる。

## 導入と使い方

Claude Code:

```text
/plugin marketplace add sasano8/skills
/plugin install auto-skill@sasano8-skills
/auto-skill:auto-skill docs/guidelines.md を参照し、このリポジトリのレビュー用スキルを作って
```

Codex はこのリポジトリで `make codex-link` してから、次のように依頼する。
両エージェント向けに開発用導入する場合は `make install-dev`。

```text
$auto-skill docs/guidelines.md と関連文書から、このリポジトリのレビュー用スキルを作って
```

| スキル | 責務 |
| --- | --- |
| [`auto-skill`](skills/auto-skill/) | 文書の関係と適用範囲を読み、正本を実行時に参照するリポジトリ用スキルを生成・更新する |

文書のパスまたは URL と、どの作業に使うかを渡す。対象リポジトリの指定がなければ作業中のものを使う。
例: 「この設計ガイドと API 規約から実装用スキルを作って」「この運用手順から障害調査用スキルを作って」。

## 成果物

既存の配置規約がなければ、対象リポジトリの `.agents/skills/<skill-name>/` へ
`SKILL.md`、`references/sources.md`、`agents/openai.yaml` を生成する。
Claude Code も対象と指定した場合は、既存の配布方式に従うか `.claude/skills/` から共通配置へリンクする。
ホームの設定や正本文書は変更しない。

`sources.md` は、入口文書、読む節、文書間の関係、適用範囲、未解決事項を持つ参照マップ。
ガイドラインのコピーは作らない。生成スキルは作業の判断前に正本を読むため、細かな規則の転記によるずれを減らせる。
正本の変更で作業の流れ自体が変わった場合は、同じ依頼で再実行してスキルも更新する。

文書が矛盾する場合は勝手に優先順位を作らず、参照切れの場合は古い要約で補わない。
確認できた範囲を生成し、不足の影響を報告する。入力・出力・更新・検証の詳しい定義は
[reference.md](reference.md) を参照。

既存の `distillation:extract-rules` はコードから規則を抽出する。本プラグインは文書を根拠に
作業手順を構成し、対象リポジトリのスキルとして直接配置する。
