---
name: env-bootstrap
description: 版管理された dotfiles を新しいマシン／既存環境へ冪等・非破壊に反映する。clone → インストーラ実行だけで環境を再現できる状態を作り、設定・スキル・editorconfig の配線状況を点検して不足を埋める。対象がアプリに書き換えられるファイルかどうかで symlink とマージ注入を選び分ける（ユーザー設定を symlink しない）。ユーザーが「オンボーディング」「環境セットアップ」「dotfiles を反映」「install.sh を実行」「新しいマシンをセットアップ」「スキルを各ツールへ配線」「symlink を張る」等を求めたときに使う。プロジェクト非依存（マシン/global 設定・dotfiles を対象。具体パス・インストーラ実体は対象 dotfiles 側）。
---

# env-bootstrap — 版管理された dotfiles をマシンへ反映する

**先に同じディレクトリの [`reference.md`](reference.md) を読む。** 原則（非破壊・冪等・強制しない）・
進め方 4 段・**配布方式の選び分け**はそちらが正本で、ここには書かない。

開発環境そのものを版管理された dotfiles から冪等に materialize する。新マシンは「clone → インストーラ実行」
だけで再現できる状態を目標にする。

このスキルの責務は**配線と点検だけ**。シークレット混入防止は `secret-guard` が持つ。

> **関心の分離**: 「何を配るか（設定・スキルを各ツールへ）」がこのスキル。**インストーラ実体と配線先の
> 具体パスは対象 dotfiles の関心**で、ここには書かない（R11）。

## 1. 点検（在/不在）

- dotfiles リポジトリが clone 済みか。冪等なインストーラが在るか。
- 期待する配線が済んでいるか。**ここで方式の誤りも一緒に見る**（下記）。

```sh
ls -l ~/.editorconfig                      # symlink で repo 実体を指していれば ok
ls -l ~/.claude/skills ~/.agents/skills    # 各ツールのスキル配線
```

### 点検で必ず見る「方式の誤り」

**アプリが書き換えるファイルが symlink になっていないか**を確認する。これは最も見つけにくく、
最も後を引く事故（`reference.md`「配布方式の選び分け」）。

```sh
# ユーザー設定が symlink なら誤り。実ファイルであるべき。
[ -L ~/.claude/settings.json ] && echo "NG: symlink（マージ注入へ移す）" || echo "ok: 実ファイル"

# repo 側にマシン固有の絶対パスが流入していないか
grep -rn "$HOME" <dotfiles>/  --include='*.json' 2>/dev/null
```

見つかったら**その場で剥がさない**。先に実ファイル化してから symlink を外す（順序を誤ると設定を失う）:

1. 実体の内容を実ファイルとして書き出す（退避コピーも取る）
2. symlink を外す
3. 版管理側の「自分が書いたキー」はマージ注入へ移す

## 2. 配線（冪等・非破壊なインストーラ）

```sh
git clone <dotfiles repo> <任意の置き場所>
<dotfiles>/install.sh    # 冪等。正しいリンクは skip、実体/別リンクは保持
```

インストーラに求める性質:

- **非破壊** — 自分が張ったリンク以外は触らない（他者管理の別リンク＝skip して警告、実ファイル＝保持）。
  上書きは明示的なフラグでのみ許す。
- **置き場所非依存** — スクリプト自身の位置から repo を解決する（絶対パスを埋め込まない）。
- **自動検出** — 配る対象は列挙で持たずディレクトリから検出する（手書き一覧は追記漏れを生む）。
- **dangling の掃除** — 改名・削除で残った、repo を指す壊れたリンクを prune する。
  これがあると「スキルを 1 つ消す」ときに手作業でリンクを追う必要がなくなる。

## 3. スキルの配線（各エージェントツールへ）

配布方式は**ツールが公式の配布チャネルを持つかどうか**で分かれる（`reference.md`）。

| ツール | 方式 |
| --- | --- |
| **Claude Code** | **プラグイン marketplace が正路**（`/plugin marketplace add <owner>/<repo>` → `/plugin install`）。バージョン管理・更新・名前空間が付く |
| **`.agents/skills` を読むツール**（Codex / Gemini CLI 等） | `SKILL.md` のディレクトリを `~/.agents/skills/<name>` へ **symlink** |
| **独自形式のツール**（Cursor 等） | どちらも読まない。`SKILL.md` を各形式へ**変換**が要る。インストーラは検出して通知するに留める |

`SKILL.md`（frontmatter `name` + `description`）は agentskills.io の共通形式なので、**実体 1 つを
複数ツールへ配れる**。marketplace で配るスキルを同じ repo から symlink でも配ると二重管理になるので、
**どちらを正路にするか決めてから配線する**（marketplace 側を正本にし、symlink は marketplace を
読まないツール向けのフォールバックに限る、が扱いやすい）。

> 開発中は marketplace を経由せずローカルのプラグインディレクトリを直接読ませたほうが速い。
> 配布物としての確認は marketplace 経由で行う（利用者と同じ経路を通す）。

## 4. 検証

```sh
readlink -f ~/.editorconfig                       # repo 実体に解決されるか
ls -lL ~/.agents/skills/<any> >/dev/null && echo "skill link ok"
[ -L ~/.claude/settings.json ] && echo "NG: まだ symlink" || echo "ok"
```

配線を外したあとは、**repo を指す壊れたリンクが残っていないか**も走査する:

```sh
find ~ -maxdepth 3 -type l -exec sh -c '
  case "$(readlink "$1")" in "<dotfiles>"/*) [ -e "$1" ] || echo "dangling: $1";; esac' _ {} \;
```

## 注意

- **ユーザー設定を symlink しない**（`reference.md` の核）。点検でこれを見つけたら、剥がす前に実ファイル化する。
- **配布方式を混ぜない** — 同じスキルを marketplace と symlink の両方で配ると、どちらが効いているか
  分からなくなる。正路を 1 つ決める。
- **複数マシンで共有する repo に、マシン固有の絶対パスを入れない**。入ったら他マシンで解決しない。
- dotfiles をアーカイブする・配布をやめるときは、**配線を剥がす手順まで用意する**（張る手順しか無いと、
  やめるときに壊れたリンクが残る）。インストーラの prune がそのまま使える。
