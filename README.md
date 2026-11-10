# sasano8-skills

**Claude Code / Codex で共用する Agent Skills**。スキル本体を 1 つのリポジトリで管理し、
Claude Code にはプラグイン marketplace、Codex にはスキルディレクトリとして配布する。

## 収録プラグイン

[プラグイン一覧](PLUGINS.md)

---

## インストール

### 使うだけなら — GitHub から

Claude Code のセッション内で 2 行:

```shell
/plugin marketplace add sasano8/skills
/plugin install distillation@sasano8-skills
```

インストール直後のサマリが `Run /reload-plugins to activate.` と言ったら `/reload-plugins` を実行する。
あとは `/distillation:extract-rules` のように呼ぶか、自然文で頼めば起動する。

更新は `/plugin marketplace update sasano8-skills`（サードパーティ marketplace は auto-update が
既定で無効なので、明示的に取りに行く）。

### 開発するなら — 手元の clone から

```sh
git clone https://github.com/sasano8/skills ~/projects/skills
cd ~/projects/skills
```

コピー形式でスキルをインストールする（本番用）。

```
make install-plugin
```

もしくは、リンク形式でスキルをインストールする。
スキルを開発しながら利用する場合はこのコマンドを使う。

```
make install-dev
```

symlink 方式では marketplace を経由せず、**その場のファイルが読まれる**（キャッシュへコピーされない）。
リンク先は 2 系統で、片方だけなら `claude-link` / `codex-link` を個別に呼ぶ:

| | リンク先 | 単位 | 呼び出し名 |
| --- | --- | --- | --- |
| Claude | `~/.claude/skills/<plugin>` | プラグインごと（全プラグイン） | `/distillation:extract-rules` |
| Codex | `~/.agents/skills/<skill>` | スキルごと（全スキル） | `$extract-rules` |

どちらも `plugins/` にあるものを**すべて**張る（`PLUGIN=` は効かない）。Claude だけ 1 プラグインに
絞ると、Codex は全スキル・Claude は 1 つという非対称な状態になり、受け入れ確認にならないため。
`PLUGIN=` が効くのはコピー形式の `make install-plugin` だけ。

Codex にはプラグインの概念が無いのでスキル単位で張る（名前空間も付かない）。
Claude 側は `plugin list` 上の id が `distillation@skills-dir` になるだけで、呼び出し名は変わらない。

> コピー形式とリンク形式は**同名だと共存できない**（marketplace 版が優先され、symlink 側は
> 読み込まれない）。そのため `make install-plugin` / `make install-dev` は互いに他方を先に外す。
> どちらを実行しても切り替わるので、間に片付けのコマンドを挟む必要はない。
>
> `make install-plugin` は Codex 側の symlink も外す。Codex には marketplace が無く「コピー形式」が
> 存在しないため、残すと Claude はコピー時点のスナップショット、Codex は作業ツリーの現在、
> という**エージェントごとに違う版が動く状態**になり、受け入れ確認にならないから。
> 両方に戻すのは `make install-dev` 一発。
>
> 逆向きも同じで、`make install-dev` はコピー形式の痕跡（プラグイン・marketplace 登録・
> `settings.json` の記述）をすべて外してから symlink を張る。片方だけを外したいときは
> `make uninstall-copy` / `make uninstall-dev`。
>
> symlink の除去は**リンク先がこのリポジトリかどうか**で判定する（リンク名では判定しない）。
> スキルを改名・削除しても古いリンクが取り残されないため。他のリポジトリを指すリンクには触れない。

> ローカル登録と GitHub 登録は**同じ marketplace 名**（`sasano8-skills`）を名乗るので、
> 両方を同時には登録できない。切り替えるときは `/plugin marketplace remove sasano8-skills` してから
> もう一方を add する。


## アンインストール

インストールしたプラグインは以下で削除できます。

```
make uninstall
```

削除されるプラグインはコピーされたもの、リンクされたもの両対応です。
`settings.json` に書かれた `extraKnownMarketplaces` / `enabledPlugins` も併せて掃除します。

> **なぜ掃除が要るか**: `claude plugin install` は `~/.claude/settings.json` にこの 2 つを書く。
> 通常は `uninstall` / `marketplace remove` が消すが、`known_marketplaces.json` から先に消えていると
> `marketplace remove` が `not found` で失敗し、settings.json の取り残しだけが残る。
> その状態は CLI では回収できない（remove が常に not found になる）ので、
> [`scripts/forget-marketplace.mjs`](scripts/forget-marketplace.mjs) が直接消している。
> 触るのは当該 marketplace 由来のエントリだけ。消すものが無ければ書き込まないので、
> 他人の `settings.json` を無用に書き換えない（空の `{}` が残るのは無害なので放置する）。

---

## 開発

定形タスクは [Makefile](Makefile) にある。`make` で一覧。

```sh
make validate   # marketplace と全プラグインのマニフェストを検証
make update     # marketplace のカタログを取り直す
make tag-dryrun # 打たれる release タグ名を確認するだけ
make tag        # release タグを打つ（PUSH=1 で origin へ push まで）
```

対象プラグインは `PLUGIN=<name>` で切り替える（既定 `distillation`）。効くのは 1 プラグインを名指しする
ターゲット（`install-plugin` / `tag` / `tag-dryrun`）だけで、`install-dev` 系は常に全プラグインを張る。

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
5. `make sync-references` → `make validate` → `make install-dev` で動作確認

`plugin.json` の `version` を上げたときだけ利用者に更新が届く。リリースのたびに bump する。

### スキル間で定義を共有する（生成コピー方式）

共通定義の正本は `plugins/<plugin>/reference.md` に置く。トップレベルの
[`sync-references.mjs`](sync-references.mjs) が、`plugins/*/skills/*/SKILL.md` のある
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
`--strict` なので警告（`description` 欠落、`author` 欠落など）も失敗にする。
API キーは要らない（ローカルのファイルを読むだけ）。

同じものを PR と main への push で回す:
[`.github/workflows/validate.yml`](.github/workflows/validate.yml) — Node を入れて
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

---

## CI でスキルを走らせる

利用側のプロジェクトで、スキル本体を置かずにこの marketplace を参照して実行する:

<!-- TODO: [distill:readme-ci-sample-version-drift]: CI サンプルの action の版を自リポジトリの workflow と揃える -->

```yaml
- uses: actions/checkout@v6
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    plugin_marketplaces: "https://github.com/sasano8/skills.git"
    plugins: "distillation@sasano8-skills"
    prompt: "/distillation:extract-issues 課題を洗い出して。マージはせず、課題票をブランチに載せて PR を作る"
    claude_args: "--max-turns 30"
```

GitHub Actions 以外（GitLab CI など）では素の CLI を並べる:

```sh
claude plugin marketplace add https://github.com/sasano8/skills.git
claude plugin install distillation@sasano8-skills
claude -p "/distillation:extract-rules ..."
```

コンテナイメージに焼いておきたい場合は、ビルド時に一度インストールして `~/.claude/plugins` を
イメージへコピーし、`CLAUDE_CODE_PLUGIN_SEED_DIR` でそこを指す（実行時に clone しなくて済む）。

各プラグインの CI 上の注意（人間の判断を要するコマンドは CI で回さない、など）は
それぞれの README を参照。

---

## 付録: Claude の marketplace の仕組み

以下は使うだけなら知らなくてよい。挙動が腑に落ちないときや、配布方法を変えるときに読む。

### marketplace source と plugin source は別物

| | 何を指すか | どこで指定するか |
| --- | --- | --- |
| **marketplace source** | `marketplace.json` カタログ自体の取得元 | `/plugin marketplace add` の引数、または settings の `extraKnownMarketplaces` |
| **plugin source** | カタログに載る個々のプラグインの取得元 | `marketplace.json` の各エントリの `source` |

このリポジトリは両方を兼ねる。カタログもプラグイン実体も同じ repo にあるので、
plugin source は相対パス（`"./plugins/distillation"`）を使っている。
相対パスはカタログを**ローカルにコピーしてから**解決されるので、ローカル追加でも GitHub 追加でも同じように動く。
（ただし `marketplace.json` の URL を直接指す追加方法だけは、そのファイルしか落ちてこないので相対パスが解決できない。）

### marketplace の追加方法は 4 種類

```shell
/plugin marketplace add sasano8/skills                        # GitHub の owner/repo
/plugin marketplace add https://gitlab.com/x/y.git#v1.0.0     # 任意の git URL（#ref でブランチ/タグ固定）
/plugin marketplace add ~/projects/skills                     # ローカルのディレクトリ ← 開発時はこれ
/plugin marketplace add https://example.com/marketplace.json  # ホストされた JSON への直リンク
```

**ローカル marketplace** は「手元のディレクトリを marketplace として登録する」だけで、特別なモードではない。
プラグインを書いている最中の確認のほか、社外に出さない private な配布にも使える。
公開したくなったら同じ repo を push して、利用者側は `owner/repo` で追加する — 中身は変えなくていい。

### 「グローバル」はどこを指すか

marketplace の登録そのものは**ユーザー単位でグローバル**で、`~/.claude/plugins/known_marketplaces.json`
に 1 つだけ保存される（プロジェクトごとではない）。プラグイン本体は `~/.claude/plugins/cache/` にコピーされる。

一方 **プラグインの有効化はスコープを選べる**:

| スコープ | 効く範囲 | 書かれる場所 |
| --- | --- | --- |
| **user** | 自分の全プロジェクト | `~/.claude/settings.json` |
| **project** | この repo の全員（コミットして共有） | `.claude/settings.json` |
| **local** | この repo の自分だけ | `.claude/settings.local.json` |
| **managed** | 組織が強制（変更不可） | 管理者の managed settings |

`/plugin install` は対話でスコープを聞いてくる。非対話なら `claude plugin install <plugin>@<marketplace> --scope project`。

Anthropic 公式には `claude-plugins-official`（初回起動時に自動登録）と
`claude-community`（`anthropics/claude-plugins-community` を自分で add）があり、
このリポジトリのような**サードパーティ marketplace はそれらと並列に共存する**。

### プロジェクトのメンバー全員に配る

対象プロジェクトの `.claude/settings.json` に書いてコミットする。
メンバーがそのフォルダを trust した時点でインストールを促される。

```json
{
  "extraKnownMarketplaces": {
    "sasano8-skills": {
      "source": { "source": "github", "repo": "sasano8/skills" }
    }
  },
  "enabledPlugins": { "distillation@sasano8-skills": true }
}
```

## ライセンス

MIT
