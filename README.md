# sasano8-skills

**Claude Code のプラグイン marketplace**。ここに複数のプラグイン（＝スキル群）を並べて、
1 つのリポジトリからまとめて配布・更新する。

## 収録プラグイン

| プラグイン | 内容 | スキル |
| --- | --- | --- |
| [distillation](plugins/distillation/) | コードから規則・慣習を蒸留してスキル草稿を生成し、未起票の課題をソースの `TODO:` / `FIXME:` / `REJECT:` タグへ還す | `extract-rules` `extract-issues` `merge-issues` `grep-issues` |

プラグインのスキルは常に**プラグイン名で名前空間される**（`/<plugin>:<skill>`）ので、
別の marketplace と名前が衝突しない。自然文でも起動する（例: 「蒸留して」）。

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

コピー形式でスキルをインストールする。

```
make install
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
| Claude | `~/.claude/skills/<plugin>` | プラグイン 1 つ | `/distillation:extract-rules` |
| Codex | `~/.agents/skills/<skill>` | スキルごと | `$extract-rules` |

Codex にはプラグインの概念が無いのでスキル単位で張る（名前空間も付かない）。
Claude 側は `plugin list` 上の id が `distillation@skills-dir` になるだけで、呼び出し名は変わらない。

> コピー形式とリンク形式は**同名だと共存できない**（marketplace 版が優先され、symlink 側は
> 読み込まれない）。そのため `make install` / `make install-dev` は互いに他方を先に外す。
> どちらを実行しても切り替わるので、間に片付けのコマンドを挟む必要はない。
>
> `make install` は Codex 側の symlink も外す。Codex には marketplace が無く「コピー形式」が
> 存在しないため、残すと Claude はコピー時点のスナップショット、Codex は作業ツリーの現在、
> という**エージェントごとに違う版が動く状態**になり、受け入れ確認にならないから。
> 両方に戻すのは `make install-dev` 一発。
>
> 逆向きも同じで、`make install-dev` はコピー形式の痕跡（プラグイン・marketplace 登録・
> `settings.json` の記述）をすべて外してから symlink を張る。片方だけを外したいときは
> `make uninstall-copy` / `make uninstall-dev`。

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

対象プラグインは `PLUGIN=<name>` で切り替える（既定 `distillation`）。

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
CLAUDE.md                            # @AGENTS.md を import するだけ（Claude Code は AGENTS.md を読まない）
.claude-plugin/marketplace.json      # marketplace カタログ（このリポジトリのルートに 1 つ）
plugins/
  distillation/
    .claude-plugin/plugin.json       # プラグインのマニフェスト
    reference.md                     # スキル間で共有する定義（正本）
    skills/
      extract-rules/SKILL.md         # = /distillation:extract-rules
      extract-rules/reference.md     # → ../../reference.md（symlink）
      extract-issues/SKILL.md
      merge-issues/SKILL.md
      grep-issues/SKILL.md
    README.md
  <next-plugin>/                     # 2 つ目以降も同じ形で並べる
workspaces/                          # スキルの作業場置き場（workspaces/<skill>/）
  distillation/default/              # このリポジトリ自身を対象にした distillation の作業場
    {config,issue,skill}/            # → plugins/distillation/（プラグイン実体）とは別物
```

`.claude-plugin/` の中に置くのは `plugin.json` / `marketplace.json` **だけ**で、`skills/` や `agents/`、
`hooks/` はプラグインのルート直下に置く（よくある間違い）。

規約は `AGENTS.md` を実体とし、`CLAUDE.md` は `@AGENTS.md` の 1 行だけを持つ
（**Claude Code は `AGENTS.md` を読まない**ため。Codex は `AGENTS.md` を読む）。
編集は `AGENTS.md` 側へ。

### プラグインを 1 つ追加する

1. `plugins/<name>/.claude-plugin/plugin.json` を作る（`name` がスキルの名前空間になる）
2. `plugins/<name>/skills/<skill>/SKILL.md` を書く（frontmatter は `name` と `description` が要。`description` は
   「いつ使うか」を具体的に書く — Claude はここだけを見て起動を判断する）
3. ルートの `.claude-plugin/marketplace.json` の `plugins` に `{"name": ..., "source": "./plugins/<name>", ...}` を足す
4. `make validate` → `make install-dev PLUGIN=<name>` で動作確認

`plugin.json` の `version` を上げたときだけ利用者に更新が届く。リリースのたびに bump する。

### スキル間で定義を共有する（symlink 方式）

共通の定義は**プラグインのルートに 1 ファイル置いて、各スキルディレクトリから symlink する**。
SKILL.md 側は `[reference.md](reference.md)` と隣接ファイルとして参照する。

**なぜ symlink なのか**（他の手段を採らなかった理由。変えるときはここを読む）:

| 手段 | 却下の理由 |
| --- | --- |
| `${CLAUDE_SKILL_DIR}/../../reference.md` | この変数を展開するのは Claude Code だけ。Codex 等へ持ち出すと壊れる（下記「Claude 以外のエージェントで使う」の方針と衝突） |
| 各スキルに複製 | 4 ファイルを同期し続けることになり、共通化した意味が消える |
| SKILL.md から `../../reference.md` を直接参照 | スキルディレクトリ外の相対参照は公式に定義されていない。隣接ファイルの参照だけが文書化された挙動 |

symlink が成り立つ根拠:

- プラグイン自身のディレクトリ内で解決される symlink は、インストール時のキャッシュコピーでも
  **相対 symlink のまま保たれる**（プラグインの外を指す symlink は安全のためスキップされる）
- スキルディレクトリが自己完結するので、`make codex-link` で Codex 側へ symlink しても解決する

> **Windows は対象外**。`core.symlinks` が無効な環境で clone すると `skills/*/reference.md` が
> パス文字列を含むテキストファイルになり、参照が壊れる。Windows を対象に入れるなら複製方式へ
> 切り替え、同期チェックを `make validate` に足すこと。

### 検証の中身と CI

`make validate` は marketplace カタログ・各 `plugin.json`・各 `SKILL.md` の frontmatter を検査し、
`--strict` なので警告（`description` 欠落、`author` 欠落など）も失敗にする。
API キーは要らない（ローカルのファイルを読むだけ）。

同じものを PR と main への push で回す:
[`.github/workflows/validate.yml`](.github/workflows/validate.yml) — Node を入れて
`@anthropic-ai/claude-code` を `npm install -g` し、`make validate` を実行するだけ。

> CLI は `@latest` で入れている。新しい版で検査項目が増えると、コードを触っていなくても CI が落ちることがある。
> それを避けたければ workflow でバージョンを固定する。

---

## Claude 以外のエージェントで使う

**marketplace / プラグインの仕組みは Claude Code 固有**だが、中身の `SKILL.md` は
frontmatter（`name` / `description`）＋ Markdown 本文という素の形式で、特定エージェントの API に依存していない。
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
`extract-rules` になる点だけ違う。共有 `reference.md` は symlink がスキルディレクトリ内に
入っているので、そのまま解決される。

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