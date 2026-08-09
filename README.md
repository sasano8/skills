# skill-distillation

コードを一次情報（＝正）として読み、そこから規則・慣習を **蒸留** して再利用可能なスキル草稿にまとめる
Claude Code プラグイン。あわせて未起票の**課題**を抽出して起票し、ユーザーの対応方針を
**ソースの `TODO:` / `FIXME:` / `REJECT:` タグへ還す**（コードファースト＝正をコードに一本化する）。

このリポジトリは **[プラグイン marketplace](https://code.claude.com/docs/en/plugin-marketplaces)** を兼ねる。

## インストール

```
/plugin marketplace add sasano8/skill-distillation
/plugin install distillation@sasano8-skills
```

インストール後は `/distillation:distill` で呼び出す（自然文でも起動する。「蒸留して」「課題を洗い出して」など）。

プロジェクトのメンバー全員に配りたい場合は、対象プロジェクトの `.claude/settings.json` に書く:

```json
{
  "extraKnownMarketplaces": {
    "sasano8-skills": {
      "source": { "source": "github", "repo": "sasano8/skill-distillation" }
    }
  },
  "enabledPlugins": { "distillation@sasano8-skills": true }
}
```

## CI で走らせる（GitHub Actions）

プロジェクト側にスキル本体を配置せず、この marketplace を参照して実行する:

```yaml
name: distill
on:
  push:
    branches: [main]
jobs:
  distill:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v6
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          plugin_marketplaces: "https://github.com/sasano8/skill-distillation.git"
          plugins: "distillation@sasano8-skills"
          prompt: "/distillation:distill 蒸留して。マージはせず、課題票と草稿をブランチに載せて PR を作る"
          claude_args: "--max-turns 30"
```

> **注意**: このスキルの 3 コマンドのうち「マージ」はユーザーの対応方針を入力に取るため、
> 人間のいない CI では走らせない。CI で回すのは「蒸留（起票まで）」と「課題列挙」に限り、
> 対応方針は PR のレビューコメントで返して、マージは手元の対話セッションで行う。

GitLab CI など Actions 以外では素の CLI を並べる:

```sh
claude plugin marketplace add https://github.com/sasano8/skill-distillation.git
claude plugin install distillation@sasano8-skills
claude -p "/distillation:distill ..."
```

## できること

| コマンド | 動作 |
| --- | --- |
| **蒸留** | scope 追従 → 読解 → スキル草稿の生成/更新 → 課題起票 → 一覧提示 |
| **マージ** | 対応方針が決まった課題をソースのタグへ**転記**する（転記のみ・実修正はしない） |
| **課題列挙** | scope 内の `TODO:｜FIXME:｜REJECT:` を grep して一覧表示（read-only） |

成果物・課題・scope は対象プロジェクトの `.cache/distillation/<target>/` に target 単位で永続管理する
（git 非追跡の作業場。コミットしない）。

詳細は [`plugins/distillation/skills/distill/SKILL.md`](plugins/distillation/skills/distill/SKILL.md) を参照。
設計判断の外部的な根拠（ETH Zurich の実証・タグ文法の先行例）は同ファイルの「設計の根拠」節にある。

## 開発

```sh
claude plugin validate ./plugins/distillation --strict
```

## ライセンス

MIT
