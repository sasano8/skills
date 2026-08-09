# advisor

変化する製品情報を回答時点で調査し、用途と優先順位に合う選択肢を比較・助言する Claude Code プラグイン。

インストール手順・marketplace の仕組みは [リポジトリ README](../../README.md) を参照。

```shell
/plugin marketplace add sasano8/skills
/plugin install advisor@sasano8-skills
```

## 収録スキル

| スキル | 責務 |
| --- | --- |
| [`ai-model`](skills/ai-model/) | Claude Code / Codex の現在のモデルと速度・推論設定を公式情報から調査し、組み合わせごとの用途マトリクスと推奨構成を提示する |

`ai-model` はモデル名や設定一覧を固定せず、起動するたびに検索する。最初に日付・出典付きの調査結果を示し、
その後で用途マトリクスと推薦を提示する。

## 作業場

助言は会話に流して消さず、`workspaces/advisor/<target>/<skill>.md` へ日付・出典付きで残す
（`ai-model` なら `ai_model.md`）。置き場所の解決・書式・既存ファイルの扱いは
[reference.md](reference.md) が正本。distillation と同じ規約で、宣言のキーだけが
`advisor-workspace:` になる。

追跡する意味は履歴が差分になること — 製品情報は変わるので、「前回いつ・何を根拠にこう決めたか」が
git log に残ると、再調査したときに何が動いたかを読める。
