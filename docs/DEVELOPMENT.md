# 開発ガイド

[README](../README.md) · [導入・配布ガイド](INSTALLATION.md)

### 最初に読むもの

| 知りたいこと | 参照先 |
| --- | --- |
| 編集時に守る規約・正本と生成物の扱い | [AGENTS.md](../AGENTS.md) |
| 収録スキルと対象プラグインの入口 | [PLUGINS.md](PLUGINS.md) → 各プラグインの README |
| 対象プラグインの共通定義 | `plugins/<plugin>/reference.md`（存在する場合） |
| 実行するコマンドと依存関係 | [Makefile](../Makefile) |
| CI の実行条件・ツール設定 | [validate.yml](../.github/workflows/validate.yml) |

この節は作業の進め方、`AGENTS.md` は編集規約、各プラグインの文書は固有の仕様を扱う。
規則の詳細はそれぞれの正本で確認する。

### 開発環境と普段の流れ

共有文書の同期とテストは Python 3.10 以降の標準ライブラリだけで動く。追加パッケージは不要。
プラグインの検証・導入には Git、make、Node.js、Claude Code CLI も使う。Node.js の版と CLI の導入方法は
[CI の設定](../.github/workflows/validate.yml) に合わせる。現行 CI は Python 3.12、Node.js 22 と CLI の `@latest` を使う。
ローカルの構成検証には API キーは不要。モデルを呼び出す動作確認には別途認証が必要。

1. 作業ツリーの差分と対象プラグインの文書を確認する。
2. 規約に従って正本を編集する。共通定義とスキル固有の手順の分担は `AGENTS.md` を参照する。
3. `make sync-references` で配布用コピーを同期し、生成物の差分も確認する。
4. `make validate` を実行する。新規スキルは起動条件に合う代表的な依頼でも手順を確認する。
5. 正本と必要な生成物を一緒にコミットする。モデルで実行した確認と、構成・参照だけの確認は分けて報告する。

初回の開発用導入は [導入ガイド](INSTALLATION.md#開発するなら--手元の-clone-から) を参照。導入先や登録方法を変更した場合は、
その方式の動作も確認する。定形タスクは `make` で一覧できる。

```sh
make sync-references # 共通定義を配布用コピーへ反映
make validate   # コピーの同期・同期処理のテスト・marketplace と全プラグインを検証
make update     # marketplace のカタログを取り直す
make tag-dryrun PLUGIN=advisor # 対象の release タグ名を確認するだけ
make tag PLUGIN=advisor        # 対象の release タグを打つ（PUSH=1 で origin へ push まで）
```

`install-plugin` / `tag` / `tag-dryrun` は、`PLUGIN=<name>` で対象を必ず指定する。
省略や存在しない名前は処理開始前にエラーになる。`install-dev`・同期・検証は全プラグインが対象で、
`PLUGIN` では絞り込まない。

`make install-dev` してあれば、プラグインを編集して `/reload-plugins` で反映できる（再起動不要）。
SKILL.md の編集はセッション中に即反映される。

> `/reload-plugins` のスキル件数は `commands/` しか数えないので、`skills/` しか持たないプラグインでは
> `0 skills` と表示されることがある。読み込まれていないという意味ではない。

グローバルに symlink を張らず**そのセッションだけ**で試したいときは、素のフラグを使う:

```sh
claude --plugin-dir ./plugins/<name>
```

同名のプラグインが既にインストール済みでも、そのセッションではこちらが優先される。
名前が衝突する 2 版を並べて比べたいときくらいしか出番がないので、`make` のターゲットにはしていない。

### リポジトリ構成

```
AGENTS.md                            # エージェント向けの規約（実体）
docs/
  DEVELOPMENT.md                    # 開発手順・構成・検証
  INSTALLATION.md                   # 導入・更新・配布の詳細
  PLUGINS.md                        # 収録プラグインとスキルの一覧
.claude-plugin/marketplace.json      # marketplace カタログ（このリポジトリのルートに 1 つ）
plugins/
  distillation/
    .claude-plugin/plugin.json       # プラグインのマニフェスト
    reference.md                     # スキル間で共有する定義（正本）
    skills/
      extract-rules/SKILL.md         # = /distillation:extract-rules
      extract-rules/reference.md     # 正本から生成した配布用コピー
      extract-rules/agents/openai.yaml  # Codex 用のメタデータ（Claude は読まない）
      extract-issues/SKILL.md
      merge-issues/SKILL.md
      grep-issues/SKILL.md
    README.md
  <next-plugin>/                     # 2 つ目以降も同じ形で並べる
workspaces/                          # プラグインの作業場置き場（workspaces/<plugin>/<target>/）
  distillation/default/              # このリポジトリ自身を対象にした distillation の作業場
    {config,issue,skill}/            # → plugins/distillation/（プラグイン実体）とは別物
  advisor/default/
    ai_model.md                      # advisor の成果物（1 スキル 1 ファイル）
.agents/skills/                      # このリポジトリの開発に使う専用スキル（配布プラグインと別）
```

`.claude-plugin/` の中に置くのは `plugin.json` / `marketplace.json` **だけ**で、`skills/` や `agents/`、
`hooks/` はプラグインのルート直下に置く（よくある間違い）。

規約は `AGENTS.md` に一本化する。Claude Code は **2.1.277 以降、`CLAUDE.md` がない場合に
`AGENTS.md` を読む**（[公式 changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md#21277)）。
Bedrock / Vertex AI / Foundry / ゲートウェイ等への対応は
[2.1.281 で拡張](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md#21281)された。利用環境では最新版を使い、
`/config` の「Project instructions」で読み込み設定を確認する。

旧版を使う利用先では `CLAUDE.md` に `@AGENTS.md` を書く橋渡しが可能だが、このリポジトリには置かない。
独立した `CLAUDE.md` が残るプロジェクトでは `AGENTS.md` が代わりに読まれるとは限らないので、
既存の指示を確認してから統合する。

### プラグインを 1 つ追加する

1. `plugins/<name>/.claude-plugin/plugin.json` を作る（`name` がスキルの名前空間になる）
2. `plugins/<name>/skills/<skill>/SKILL.md` を書く（frontmatter は `name` と `description` が要。`description` は
   「いつ使うか」を具体的に書く — Claude はここだけを見て起動を判断する）
3. 各スキルに `agents/openai.yaml` を置く（Codex 用のベンダーメタデータ。下記「ベンダー固有ファイル」）
4. ルートの `.claude-plugin/marketplace.json` の `plugins` に `{"name": ..., "source": "./plugins/<name>", ...}` を足す
5. プラグインの README を作り、一覧は [PLUGINS.md](PLUGINS.md) を更新する。ルート README の収録プラグイン欄は一覧へのリンクだけにする
6. `make sync-references` → `make validate` で検証し、開発用導入での起動・参照を確認する

`plugin.json` の `version` を上げたときだけ利用者に更新が届く。リリースのたびに bump する。

### スキル間で定義を共有する（生成コピー方式）

共通定義の正本は `plugins/<plugin>/reference.md` に置く。
[`scripts/sync_references.py`](../scripts/sync_references.py) が、`plugins/*/skills/*/SKILL.md` のある
各スキルへ `reference.md` をコピーする。共通文書がないプラグインは対象外。
スキルが 1 つだけなら、必要に応じて `SKILL.md` にまとめてもよい。

```sh
make sync-references   # 正本から全スキルへ一括コピー
make check-references  # コピーが最新か検証（書き換えなし）
make validate          # 同期チェック・同期処理のテスト・プラグイン検証
```

**編集するのは正本だけ。コミット前に同期し、生成物も一緒にコミットする。**
コピーの冒頭に生成元と直接編集禁止の案内を付ける。CI では差異・欠落・symlink を検出して失敗にし、
自動修正は行わない。コミットフックの導入は不要で、実行漏れも CI で検出できる。

各 `SKILL.md` は `[reference.md](reference.md)` と隣接ファイルとして参照する。
配布用の共有文書は通常ファイルなので、スキル単体を取得してもプラグイン直下への参照が切れない。
開発用の `make codex-link` / `make install-dev` は引き続き導入先への symlink を使う。

### 検証の中身と CI

`make validate` は共有文書の同期チェックと同期処理のテストに続き、
marketplace カタログ・各 `plugin.json`・各 `SKILL.md` の frontmatter を検査し、
`--strict` で CLI の検証基準を適用する。ディレクトリ掲載用のアイコン未設定など、
終了コードに影響しない案内もあるため、表示された警告の有無だけで合否を判断しない。
API キーは要らない（ローカルのファイルを読むだけ）。

同じものを PR と main への push で回す:
[`.github/workflows/validate.yml`](../.github/workflows/validate.yml) — Python と Node を用意して
`@anthropic-ai/claude-code` を `npm install -g` し、`make validate` を実行するだけ。

> CLI は `@latest` で入れている。新しい版で検査項目が増えると、コードを触っていなくても CI が落ちることがある。
> それを避けたければ workflow でバージョンを固定する。

---

## Claude Code / Codex の共通仕様

スキル本体は [Agent Skills](https://agentskills.io/specification) の
frontmatter（`name` / `description`）＋ Markdown 本文を共用し、配布や表示の設定を外側へ分ける。

| 対象 | 共通化するもの | エージェント別に持つもの |
| --- | --- | --- |
| プロジェクト規約 | `AGENTS.md` | 旧 Claude Code 向けの `CLAUDE.md` import（必要な利用先のみ） |
| スキル本体 | `SKILL.md`、共有 `reference.md` | Claude の marketplace / plugin manifest、Codex の `agents/openai.yaml` |
| 呼び出し | 名前・description・手順 | Claude の `/plugin:skill`、Codex の `$skill` |

frontmatter に独自の `type: func` は置かない。ベンダー固有の起動設定も、共通本文へ埋め込まない。
このリポジトリの SKILL.md も Claude 固有の変数やツール名を参照していないので、そのまま流用できる。

### OpenAI Codex

Codex は次の順でスキルディレクトリを走査する:

| 位置 | パス |
| --- | --- |
| リポジトリ | `.agents/skills/`（cwd から上位ディレクトリへ遡って探索） |
| ユーザー | `$HOME/.agents/skills/` |
| 管理者 | `/etc/codex/skills/` |

なので、marketplace は使わず**ディレクトリを置く／symlink する**だけでよい:

```sh
make codex-link      # 全スキルを ~/.agents/skills へ symlink（Claude と両方なら make install-dev）
make codex-unlink
```

特定リポジトリだけで使うなら `SKILLS_DIR=<repo>/.agents/skills make codex-link`。

Codex CLI では `$extract-rules` のように明示起動、`/skills` で一覧。`description` にマッチすれば
暗黙起動もする（Claude と同じ挙動）。呼び出し名が `/distillation:extract-rules` ではなく
`extract-rules` になる点だけ違う。共有 `reference.md` は通常ファイルとしてスキルディレクトリ内に
含まれるので、スキル単体の配布でも参照できる。

### ベンダー固有ファイル

エージェント固有の設定は **SKILL.md 本文には書かず、別ファイルに寄せる**。SKILL.md は全エージェント
共通の正本なので混ぜない。別ファイルなら、読まないエージェントでは単に無視されるので無害。

現在置いているのは 1 つだけで、**全スキルに置く**:

```
plugins/<plugin>/skills/<skill>/agents/openai.yaml
```

Codex がスキル一覧に出す表示名・短い説明・既定プロンプトを持つ。

| | 読むか | 効果 |
| --- | --- | --- |
| Codex | 読む | `display_name` / `short_description` / `default_prompt` が一覧と起動に反映される |
| Claude Code | 読まない | `agents/` を解釈するのは**プラグインのルート直下だけ**で、スキル内のこれは無視される |

つまり Claude 側の起動判定は SKILL.md の `description` 一本で、このファイルの有無に影響されない。
Claude 用のサブエージェントを足したくなったら、`plugins/<plugin>/agents/` に置くこと（スキルの中では効かない）。

### その他

Cursor / Gemini CLI / Copilot なども `SKILL.md` 形式を読む方向に寄っており、
「1 スキル = 1 ディレクトリ + SKILL.md」を守っておけば移植は symlink で済む。
移植性を保つために、SKILL.md には特定エージェント固有のツール名・パス変数
（`${CLAUDE_PLUGIN_ROOT}` など）を書かないでおく。
