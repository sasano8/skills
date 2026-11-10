# 導入・配布ガイド

[README](README.md) · [開発ガイド](DEVELOPMENT.md)

## インストール

### 使うだけなら — GitHub から

#### Claude Code

Claude Code のセッション内で 2 行:

```shell
/plugin marketplace add sasano8/skills
/plugin install distillation@sasano8-skills
```

インストール直後のサマリが `Run /reload-plugins to activate.` と言ったら `/reload-plugins` を実行する。
あとは `/distillation:extract-rules` のように呼ぶか、自然文で頼めば起動する。

更新は `/plugin marketplace update sasano8-skills`（サードパーティ marketplace は auto-update が
既定で無効なので、明示的に取りに行く）。

#### Codex

標準の `skill-installer` が利用できる環境では、GitHub のスキルディレクトリを指定して導入する。
例えば Codex で次のように依頼する:

```text
$skill-installer https://github.com/sasano8/skills/tree/main/plugins/auto-skill/skills/auto-skill からスキルをインストールして
```

導入後は新しいセッションで `$auto-skill` と呼び出す。他のスキルは [一覧](PLUGINS.md) から選ぶ。
共有文書はスキル内に同梱される。保存先はインストーラーの設定に従う
（標準インストーラーの既定は `$CODEX_HOME/skills`、未設定なら `~/.codex/skills`）。
以下の開発用リンクとは別のコピーなので、作業ツリーの編集はオンライン導入したコピーには反映されない。

### 開発するなら — 手元の clone から

```sh
git clone https://github.com/sasano8/skills ~/projects/skills
cd ~/projects/skills
```

コピー形式でスキルをインストールする（本番用）。

```
make install-plugin PLUGIN=advisor
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
この導入手順では `make install-plugin PLUGIN=<name>` で対象を指定する。

このリポジトリの Codex 向け導入はスキル単位で行う（名前空間も付かない）。
Claude 側は `plugin list` 上の id が `distillation@skills-dir` になるだけで、呼び出し名は変わらない。

> コピー形式とリンク形式は**同名だと共存できない**（marketplace 版が優先され、symlink 側は
> 読み込まれない）。そのため `make install-plugin` / `make install-dev` は互いに他方を先に外す。
> どちらを実行しても切り替わるので、間に片付けのコマンドを挟む必要はない。
>
> `make install-plugin` は Codex 側の開発用 symlink も外す。これは Claude のコピー版と
> Codex の作業ツリー版で受け入れ確認する状態を避けるため。両方の開発用リンクに戻すのは `make install-dev`。
> `skill-installer` が導入した Codex のコピーは、これらの切り替え・アンインストールの対象外。
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
