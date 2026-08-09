# distillation 共通リファレンス

`extract-rules` / `extract-issues` / `merge-issues` / `grep-issues` の 4 スキルが共有する定義。
各 SKILL.md はこのファイルを**手順の正本として参照する**（同じ内容を各 SKILL.md へ再記載しない）。

対象プロジェクトのコードを一次情報（＝正）として読み、そこから推測できる規則・慣習・パターンを
**蒸留**して再利用可能なスキル草稿にまとめる。あわせて、まだ起票されていない**課題**を抽出して
起票し、ユーザーの判断を経て**ソースのタグへ還す**（コードファースト）。

## 原則

- **コードファースト**: 正は原則コード。ドキュメントは補助として参照する（矛盾したらコードを信じ、
  矛盾自体を課題として起票する）。
- **蒸留と規則は区別する**: コードから推測した規則（distilled）と、ユーザーが強制したい規則（rule）は
  由来（provenance）を分けて記録する。強制したい規則は蒸留を経ず rule として直接定義してよい。
- **課題はコードへ還す**: 課題票は一時的な作業場。ユーザーの対応方針が決まったらソースへタグとして
  マージし、課題票の中身はクリーンアップする（節を削除。ファイル自体は空になっても残す。
  採用＝`TODO:`/`FIXME:`・却下＝`REJECT:`・保留＝deferred。下記「タグ文法」。採用も却下も保留も、
  正はコードに一本化する）。マージは課題の**転記だけ**を行い、実修正はしない。ドキュメントも
  ソースと同様にタグで管理する。

## スキル体系

| スキル | 責務 | 書き込み先 |
| --- | --- | --- |
| `extract-rules` | 規則抽出 → スキル草稿の生成/更新 | `skill/` |
| `extract-issues` | 課題抽出 → 課題票への起票 | `issue/` |
| `merge-issues` | 対応方針をソースのタグへ転記（還流） | 対象プロジェクトのソース、`issue/` |
| `grep-issues` | ソースのタグと open 課題票の一覧 | **書かない（read-only）** |

`extract-rules` と `extract-issues` は同じ読解を土台にする。片方を実行したあと、同じ scope の読解が
まだ有効なうちにもう片方を続けて実行するのが効率的（実行の順序自体に依存関係はない）。

書き込むスキル（`extract-*` / `merge-issues`）と読むだけのスキル（`grep-issues`）を分けてあるので、
現状を見たいだけのときに書き込み可能なスキルを起動しなくてよい。

## ディレクトリ体系（既定値）

対象プロジェクトのルート基準。**このツリーが既定値の正本**（config で上書きできるが、値の再記載はしない）。
**target 単位**で分け、1 プロジェクト内で複数の蒸留対象（プロジェクト全体・特定モジュール・特定スキル等）を
並行管理できる:

```
workspaces/distillation/<target>/
├── skill/    # 規則抽出の成果物（スキル草稿。1 テーマ 1 ディレクトリ: <name>/SKILL.md）
├── issue/    # 課題票（レイヤー毎 1 ファイル・1 課題 1 節。マージ済みは節削除・ファイルは空でも残す）
└── config/   # 設定・scope の永続化（distillation.md。scope・課題は target ごとに独立）
```

`workspaces/` は**スキル共通の作業場置き場**で、その下をスキル名で仕切る（`workspaces/<skill>/`）。
このスキルは `workspaces/distillation/` を使う。プラグイン実体（`plugins/distillation/` など）と
名前が並んでも取り違えないための仕切りでもある。

- `<target>` は対象の識別名（対象スキル名・モジュール名等。プロジェクト全体を 1 対象で扱うなら `default`）。
- 既存 target を列挙し、ユーザーの指示から対象を同定する（既存に無ければ新設）。
  どの target か曖昧なら確認する。

### 置き場所の解決

作業場の場所そのものは **config に書けない**（config 自身がその中にあるので自己言及になる）。
したがって、対象プロジェクトのルートで次の順に解決する:

**① 規約ファイルの宣言**（あれば最優先）

プロジェクトのエージェント向け規約ファイル（`AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md`）に
次の 1 行があれば、そのパスを作業場として使う:

```markdown
distillation-workspace: docs/distillation/
```

既定の 2 択から外れた任意のパスに置きたいときだけ書く。既定でよいなら書かない。

> Claude Code が読むのは `CLAUDE.md` で、`AGENTS.md` は読まない。両方のエージェントに効かせるなら
> `CLAUDE.md` に `@AGENTS.md` と書いて import するか、`ln -s AGENTS.md CLAUDE.md` で橋渡しする。

**宣言されたパスが存在しなければ、勝手に新設せずユーザーに確認する。** 宣言は実体とずれうる
（移動して直し忘れる）ので、黙って別の作業場を作ると既存の課題票が取り残される。

**② 探索順**（宣言が無ければ）

1. `workspaces/distillation/` — 既定。git に追跡させて履歴に残す置き方
2. `.cache/workspaces/distillation/` — git 非追跡の一時作業場として使う置き方

2 つの違いは `.cache/` 接頭辞の有無だけ＝**追跡するかしないか**。どちらも無ければ 1 を新設する。
**両方あったらどちらを使うか確認する**（勝手に選ばない）。

宣言より探索順を既定に据えているのは、**探索はファイルシステムが正なのでずれないから**。
宣言はずれうる代わりに、任意のパスを指せる。既定の 2 択で足りるなら宣言しないほうが堅い。

既定の 2 択の間で移すときは**ディレクトリごと移動するだけでよい**
（`mkdir -p .cache/workspaces && git mv workspaces/distillation .cache/workspaces/` など）。
次回実行時に探索が拾う。ただし**両方に残さないこと** — 移動ではなくコピーすると、
探索順の都合で片方だけが使われ、もう片方が古いまま取り残される。
既定から外れた場所へ移す場合は、移動に加えて①の宣言も直す。

旧レイアウトの `.cache/distillation/<target>/`（`workspaces/` 導入前）を見つけたら、
勝手に使わず**移動を提案する**。気づかずに空の作業場を新設すると、既存の課題票を取り残したまま
同じ課題を再起票してしまう。

### 規約ファイルへの宣言を書く

宣言（①）を**書き込む**ときの手順。`CLAUDE.md` と `AGENTS.md` は同じ内容を指していることが
あるので、**先に 2 つの関係を調べてから書く**。無条件に両方へ書くと二重記載になり、
片方だけ直る事故を招く（正の二重化を避ける、という原則はここにも効く）。

| 調べた結果 | 書き込み先 |
| --- | --- |
| `CLAUDE.md` が `AGENTS.md` への symlink | `AGENTS.md` だけ（実体は 1 つ） |
| `CLAUDE.md` に `@AGENTS.md` の import 行がある | `AGENTS.md` だけ（import 経由で Claude にも届く） |
| 2 つが独立している（import も symlink も無い） | **両方に書く** |
| `AGENTS.md` しか無い | `AGENTS.md` に書き、`@AGENTS.md` を 1 行持つ `CLAUDE.md` の新設を提案する |
| `CLAUDE.md` しか無い | `CLAUDE.md` に書く。Codex 等も使うなら `AGENTS.md` への切り出しを提案する |
| どちらも無い | 使っているエージェントに合わせて作成を提案する（勝手に作らない） |

調べ方: `test -L CLAUDE.md` で symlink を判定し、`grep -n '@AGENTS\.md' CLAUDE.md` で import 行を探す
（import はコードブロック内だと無効なので、バッククォートに囲まれていないことも確認する）。

書き換えは `distillation-workspace:` の行だけを対象にする。既にその行があれば**置き換える**
（追記して 2 行にしない）。規約ファイルの他の内容には触れない。

このスキル群のうち規約ファイルを書き換えてよいのは `extract-rules` / `extract-issues` /
`merge-issues` で、作業場の場所が既定から外れると決まったときだけ。`grep-issues` は read-only
なので、ずれを見つけても報告するに留める。書き込みは `mode` に従う（confirm なら確認してから）。

### git 追跡の扱い

| 置き場所 | 追跡 | 向いている場面 |
| --- | --- | --- |
| `workspaces/distillation/` | する | 起票 → 方針決定 → マージの過程を履歴に残す。方針欄をレビューやチームで埋める |
| `.cache/workspaces/distillation/` | しない | 手元の一時的な下書き。リポジトリを汚したくない |

追跡しても**正は二重化しない**。マージ済みの課題は節ごと消えてソースのタグだけが残るので、
git に残るのは「その時点で未処理だった課題」の履歴にすぎない。

> 成果物を他プロジェクトへ持ち出すときはファイルをコピーする
> （このスキル自体は持ち出しの配線をしない）。

## config と scope（正の範囲の管理）

設定の正本は `config/distillation.md` の frontmatter（現状は環境変数的な値も雑にここへ含めてよい。
将来プロジェクト固有の設定ファイルへ分離する余地あり）:

```markdown
---
mode: confirm            # confirm | force（下記「モード」）
issue_target: 20         # 課題の上限件数（open 残を含む全レイヤー合計。既定 20）
# dirs:                  # ディレクトリを既定から変えるときだけ書く（既定値の正本は「ディレクトリ体系」節）
#   skill: <path>
#   issue: <path>
scope:                   # 「正」とみなす範囲
  code:                  # 一次情報（コード）
    - src/
  docs:                  # 補助参照（ドキュメント）
    - README.md
  exclude:               # 除外（生成物・vendor 等）
    - dist/
updated: <yyyy-mm-dd>
---
（自由記述: scope の判断理由・保留事項など）
```

- **初回実行**: config が無ければ、リポジトリ構成から scope 候補（コード / ドキュメント / 除外）を
  推定して**仮 config に書き出してそのまま走り**、成果物の提示時に scope の確認・修正を併せて求める
  （事前確認でブロックしない。合意が取れたら以後は確定 scope として扱う）。あわせて作業場を
  どちらに置くかを提示する（既定は `workspaces/distillation/`。上記「置き場所の解決」）。
  `.cache/` 側を選んだときだけ `git check-ignore` で非追跡を検証し、未 ignore なら
  .gitignore への追記を提案する（誤コミット防止）。
- **次回以降**: config を読んで scope を流用する。実態と乖離していれば（新ディレクトリの出現、
  消えたパス等）拡大・縮小を提案し、合意の上で config を更新する（勝手に広げない）。

この scope 確定は 4 スキルすべての最初の手順として共通（`grep-issues` は read-only なので、
config が無くても仮 config を書かずに推定した scope で一覧するに留める）。

## 課題票の書式

課題は成果物（`skill/`）とは別に `issue/` で管理する。**レイヤー毎に 1 ファイル**
（課題ごとにファイルは作らない）:

```
issue/
├── incompat.md   # プラットフォーム等の非互換
├── bug.md        # バグ
├── refactor.md   # リファクタリング観点
└── design.md     # 設計の不備
```

ファイル内は 1 課題 1 節（節見出しの slug が id を兼ねる）:

```markdown
## <slug> — <1 行要約>
- meta: origin: llm | user（LLM 起票は llm と明示） / status: open | answered / 起票: <yyyy-mm-dd>
- 内容: <課題の説明>
- 根拠: <file:line> <観察事実>
- 提案（任意）: <対応案>
- 対応方針（ユーザー記入欄）: <空欄で起票。対話で答えるか、ここへ直接追記してもらう>
```

**slug は target 内で一意**（レイヤー横断。タグだけから元課題を特定できるようにするため）。

## タグ文法（マージ書式）

- 採用: layer が bug / incompat → `FIXME: [distill:<slug>]: <方針の 1 行要約>`、
  refactor / design → `TODO: [distill:<slug>]: <方針の 1 行要約>`。
  行頭の `TODO:` / `FIXME:` を保つ＝既存の TODO grep ツールとの互換を維持する。
- 却下: `REJECT: [distill:<slug>]: <却下理由の 1 行>`（「対応しない」判断もソースに残す＝再起票の抑止）。
- 保留: `TODO: [distill:<slug>:deferred]: <保留内容>`（先送りもソースへ逆反映し、消えないようにする）。
- 修飾子は `[distill:<slug>:<mod>]` に連ねる（確度 `low|med|high`・`deferred`）。
- **タグ行は 1 行の要約（見出し）に収める**。長くなる場合は要約だけをタグ行に書き、詳細説明は
  直後のコメント行（タグなし）へ続ける — 詳細は grep（タグの列挙）で表示されなくてよい:

  ```python
  # TODO: [distill:container-facade-incomplete]: scheduler 系 getter の facade 追加
  #   詳細: get_scheduler_settings / get_scheduler_executor が Container に未転写。
  #   背景・根拠・方針の補足はここに自由に書く（grep 対象外でよい）。
  ```

- タグはそのファイル形式で無害なコメントとして埋める（Markdown なら HTML コメント等。ドキュメントも
  ソースと同じ扱いでタグ管理する）。
- **タグを埋め込めないソース**（コメント構文が無い JSON・生成物・バイナリ等）は、プロジェクトルートの
  `TODO.md` に `TODO: [distill:<slug>]: <要約>（対象: <path>）` の形式で列挙する（無ければ作成する。
  タグの列挙はこのファイルも grep 対象に含める）。

> この文法は既存規約に合わせてある（拡張時の根拠は「設計の根拠」節）。

## タグの列挙（grep 仕様）

scope.code（exclude 適用）と `TODO.md`（あれば）を `TODO:|FIXME:|REJECT:` で grep する。
**read-only**（起票もマージもしない・何も書き換えない）:

- `[distill:<slug>...]` 付き＝このスキル経由の課題（採用 / 保留 / 却下と修飾子を添えて表示）。
- タグ無しの素の `TODO:` / `FIXME:`＝手書きの未了作業（全体像として併せて出す）。
- `issue/` に open の課題票が残っていれば併記する（方針待ちであることを明示）。

この grep は `grep-issues` のユーザー向け列挙と、`extract-issues` の再抽出時の重複判定の両方で使う。

## モード

config の `mode`（実行時にユーザー指定があればそちらを優先）:

- **confirm（既定）**: ソースへのタグマージ・config/scope の変更を 1 件ずつ（または一覧で）
  確認してから書く。
- **force**: 対応方針が確定している課題のタグマージと、明白な scope 追従（消えたパスの除去等）を
  確認なしで適用する。課題の新規起票・`[rule]` の変更は force でも勝手に行わない。

## 注意

- 作業場を `.cache/` 側に置いた場合はコミットしない（ローカル作業場）。
  `workspaces/` 側に置いた場合は追跡が前提。いずれにせよ、ソースへマージしたタグは
  通常のコード変更としてプロジェクトのコミット規約に従う。
- 蒸留はあくまで「コードからの推測」。確度が低い規則は `[distilled:low]` と明示するか、課題
  （design 等）へ回してユーザーの判断を仰ぐ。草稿の distilled 行は再実行時にソースから再生成される
  派生物（正はあくまでソース側）。
- 対象プロジェクトに独自のスキル規約（frontmatter の必須キー等）がある場合、草稿の frontmatter は
  それに従う（この汎用スキルは具体値を定めない）。

## 設計の根拠（外部の実証・先行例）

中核の設計判断には外部の裏付けがある。**仕様を変えるときはこの節を先に読む**（ここを手放すと
劣化することが分かっているものを、簡略化のつもりで削らないため）。

### 1. 自動生成した規約を「正」にしない

`[distilled]` を派生物として扱い（正はソース側）、`[rule]` と provenance を分け、確度 low は課題へ
回して人間の判断を仰ぐ — この三点は好みではなく、実証への対応である。

> **"Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?"**
> （arXiv:2602.11988 / ETH Zurich・2026-02）: **LLM が生成したリポジトリ規約ファイルは、規約なしの
> 場合と比べてタスク成功率を平均 約 3% 低下させ、推論コストを 20% 以上増やした**。一方、開発者が
> 手で書いた規約ファイルは 約 4% 改善した（SWE-bench + 実リポジトリの手書き規約データセット、
> Sonnet 4.5 / GPT-4.1 / o4-mini / Qwen3 で検証）。

含意: **蒸留の価値は生成物そのものではなく、人間の確認を通す過程にある**。コードを読んで規約ファイルを
1 回生成するだけの先行機能（Claude Code の `/init`、Cursor の `/Generate Cursor Rules`）との差は、
provenance・確度・再実行時の差分更新・課題への差し戻しを持つこと。ここを省いて「生成して終わり」に
すると、上記の劣化側（成功率マイナス・コスト増）へ落ちる。

### 2. タグ文法の先行例

`TODO:|FIXME:|REJECT: [distill:<slug>:<mod>]: <要約>` は、以下の既存規約に意図的に揃えてある:

- **[Google Style Guide の TODO 形式](https://google.github.io/styleguide/pyguide.html)**
  （`TODO: <context(bug ref/username)> - <description>`）と同型。**`[distill:<slug>]` が context スロットに
  当たる**（＝タグだけから元課題へ辿れる、という要件は Google と同じ理由）。
- **リンタ抑制ディレクティブ族**（`# noqa: E501` / `# type: ignore[arg-type]` /
  `// eslint-disable-next-line <rule>` / `//nolint:<linter>`）＝「ツール名前空間 + コード」の事実上の標準。
  `[distill:...]` の形式的な根拠はここ。
- **`SPDX-License-Identifier:`（[REUSE](https://reuse.software/) 仕様）** — 言語を問わずコメントへ構造化タグを
  埋める形式の先行例。**コメント構文が無いファイルを別ファイルへ退避する**扱い（上記 `TODO.md`）も、
  REUSE の `.license` サイドカーと同じ発想。
- **ADR / MADR の `Status: rejected | superseded`** — `REJECT:`（却下を記録に残して再提起を防ぐ）の本家。
- **[Conventional Comments](https://conventionalcomments.org/)** の decorations 規律 — **修飾子を増やすときの
  歯止め**として従う（曖昧さのない最小集合に絞る・多すぎると可読性を損なう）。
- PEP 350 Codetags は **Rejected** だが、構造化フィールドを追加する際の語彙カタログとしてのみ参照してよい
  （これを規約の根拠として引かない）。