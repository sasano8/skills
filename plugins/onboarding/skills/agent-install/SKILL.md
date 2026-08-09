---
name: agent-install
description: コーディングエージェント本体（Claude Code / Codex CLI）をマシンへ導入する。在/不在と版・導入方式を点検し、OS と更新方針（自動更新が効くか）で導入方法を選び分けて提示し、認証を通して検証する。ユーザーが「claude を入れたい」「codex をインストール」「エージェントをセットアップ」「新しいマシンに claude code を入れる」「codex CLI の導入方法」「claude が command not found」等を求めたときに使う。プロジェクト非依存（マシン/global を対象）。スキル・プラグインの配線は env-bootstrap の担当。
---

# agent-install — エージェント本体をマシンへ導入する

**先に同じディレクトリの [`reference.md`](reference.md) を読む。** 原則（非破壊・冪等・強制しない）と
進め方 4 段はそちらが正本で、ここには書かない。

対象は**エージェント本体の CLI** だけ。導入後に設定・スキルを配線するのは `env-bootstrap` の担当。

> **導入方式は選べる。選ぶのはユーザー** — 提示して合意を取る。既に別方式で入っているものを
> 勝手に入れ替えない（重複インストールは後述の落とし穴になる）。

## 1. 点検 — 在/不在・版・どの方式で入っているか

```sh
claude --version          # 例: 2.1.211 (Claude Code)
codex --version
```

`command not found` なら不在。在るなら**どの方式で入ったか**まで見る（更新手段が変わるため）:

```sh
command -v claude codex   # ~/.local/bin/* なら公式インストーラ、Homebrew/npm の prefix 配下ならそれぞれ
claude doctor             # 導入状況・設定ファイルの検証・更新の成否を read-only で表示
```

## 2. 勧める — 方式を選び分ける

**決め手は「自動更新が効くか」**。エージェントは更新が速いので、既定は自動更新が効く方式にする。

### Claude Code

| 方式 | コマンド | 自動更新 |
| --- | --- | --- |
| **公式インストーラ**（既定で勧める） | `curl -fsSL https://claude.ai/install.sh \| bash`（macOS/Linux/WSL）<br/>`irm https://claude.ai/install.ps1 \| iex`（Windows PowerShell） | ○ |
| Homebrew | `brew install --cask claude-code` | ✗ `brew upgrade claude-code` |
| WinGet | `winget install Anthropic.ClaudeCode` | ✗ `winget upgrade Anthropic.ClaudeCode` |
| apt / dnf / apk | 署名済みリポジトリを登録（手順は公式へ） | ✗ 通常の system upgrade |
| npm | `npm install -g @anthropic-ai/claude-code` | ○ ただし npm の global が書き込み可のとき |

- リリースチャネルは 2 つ。既定の `latest` と、約 1 週遅れで大きな退行を飛ばす `stable`
  （`curl ... | bash -s stable`、または設定の `autoUpdatesChannel`）。**安定を優先するなら stable を勧める。**
- 手動更新は `claude update`。
- **`sudo npm install -g` を使わない**（権限とセキュリティの問題。公式が明示的に禁じている）。
- npm 方式は Node.js 22 以降が要る。ただし入るのはネイティブバイナリで、実行時に Node は使わない。
- Windows は「ネイティブ」と「WSL」を選べる。**サンドボックス実行が要るなら WSL 2**（ネイティブと WSL 1 は非対応）。
  ネイティブでも Git for Windows があれば Bash tool が使える（無ければ PowerShell tool になる）。

### Codex CLI

| 方式 | コマンド |
| --- | --- |
| **公式インストーラ**（既定で勧める） | `curl -fsSL https://chatgpt.com/codex/install.sh \| sh`（macOS/Linux）<br/>`powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 \| iex"`（Windows） |
| Homebrew | `brew install --cask codex` |
| npm | `npm install -g @openai/codex` |

- 更新は**インストールと同じコマンドを再実行**する（公式インストーラの場合）。

> パイプ実行（`curl ... | sh`）を嫌う環境では、スクリプトを落として中身を読んでから実行する。
> 組織ポリシーで外部スクリプトの実行が禁じられているなら、パッケージマネージャ方式を選ぶ。

## 3. 配線 — 認証と PATH

```sh
claude    # 起動するとブラウザで認証。ANTHROPIC_API_KEY があれば承認プロンプトに変わる
codex     # 起動して「Sign in with ChatGPT」を選ぶ
```

- **課金プランが要る**。Claude Code は Pro / Max / Team / Enterprise / Console（無料プランでは使えない）。
  Codex は ChatGPT の Plus / Pro / Business / Edu / Enterprise。API キーでも使えるが追加の設定が要る。
- インストール直後に `command not found` なら **PATH が未反映**。シェルを開き直すか rc を読み直す。
  公式インストーラは `~/.local/bin` に置く（`echo $PATH` で確認）。

## 4. 検証

```sh
claude --version && claude doctor
codex --version
```

`claude doctor` は起動せずに導入と設定の健全性を出す。**版が出て doctor が警告を出さなければ完了。**

## 注意

- **重複インストールが一番の落とし穴** — 別方式で二重に入ると、更新したはずの版が起動しない。
  `command -v` の結果が期待した方式と食い違うなら、古い方を消してから入れ直す。シェルの alias 残りも疑う。
- **認証情報はユーザー設定に書かれる** — Claude は `~/.claude/` と `~/.claude.json`、Codex は `~/.codex/`
  （`auth.json` を含む）。**これらを dotfiles へ symlink しない・コミットしない**。理由と代替（マージ注入）は
  [`reference.md`](reference.md)「配布方式の選び分け」、秘密の扱いは `quality` プラグインの **R15**。
- **アンインストールは方式ごとに違う** — 入れた方式に対応する手順で消す。設定ファイルの削除は
  セッション履歴や MCP 設定も消えるので、消す前に合意を取る。
- **コマンドと URL は公式が正本** — ここに写した内容は古くなりうる。食い違ったら公式を優先し、ここを直す。
  [Claude Code setup](https://code.claude.com/docs/en/setup) / [Codex CLI](https://developers.openai.com/codex/cli/)
