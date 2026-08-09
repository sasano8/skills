---
name: secret-guard
description: シークレットの混入を全リポジトリの commit 前に止めるグローバルガードを導入する。gitleaks + global pre-commit hook（core.hooksPath）+ global secret baseline（core.excludesFile）の 3 層を、冪等・非破壊に点検して配線し、ダミーで効くことを検証する。ユーザーが「gitleaks を入れたい」「pre-commit をグローバルに」「シークレットの混入を防ぎたい」「秘密情報が commit されないようにして」「secret scan」等を求めたときに使う。プロジェクト非依存（マシン/global 設定を対象。フック実体の置き場は対象 dotfiles 側）。
---

# secret-guard — シークレット混入をコミット前に止める

**先に同じディレクトリの [`reference.md`](reference.md) を読む。** 原則（非破壊・冪等・強制しない）と
進め方 4 段はそちらが正本で、ここには書かない。

全リポジトリの commit 時にステージをスキャンし、シークレット混入を**コミット前に止める**。

> **判断は持たない** — 「シークレットを commit しない」という規約の正本は `quality` プラグインの **R15**。
> ここはそれをマシンに materialize する導入手順だけを持つ。フック実体の置き場は対象 dotfiles の関心。

R15 は多層防御を要求する。このスキルが担うのは **①追跡前に弾く** と **③コミット前に検知** の 2 層:

| 層 | 手段 | 担当 |
| --- | --- | --- |
| ① 追跡前に弾く | global secret baseline（`core.excludesFile`） | このスキル（下記 3） |
| ② 値の分離 | `.env`(ignore) と `.env.example`(committed・値なし) | 各リポジトリ（R15） |
| ③ コミット前に検知 | gitleaks + global pre-commit | このスキル（下記 1・2） |
| ④ 漏れた後 | rotate（失効扱い）→ 履歴 scrub | 人手（R15 ④） |

## 1. gitleaks 導入（単一バイナリ・Python 非依存）

```sh
gitleaks version            # 在れば skip（冪等）
```

**導入は環境に応じて 1 つ選ぶ**:

```sh
# A) Homebrew（macOS / Linuxbrew）— 最も簡単
brew install gitleaks

# B) Go が在るなら
go install github.com/gitleaks/gitleaks/v8@latest   # $(go env GOBIN)/gitleaks に入る

# C) Linux で brew/go 無し — リリースから 1 バイナリを取得（PATH の通った ~/.local/bin へ）
VER=8.28.0   # 最新版は https://github.com/gitleaks/gitleaks/releases で確認
ARCH=x64     # arm64 の場合は arm64
mkdir -p ~/.local/bin
curl -sSL "https://github.com/gitleaks/gitleaks/releases/download/v${VER}/gitleaks_${VER}_linux_${ARCH}.tar.gz" \
  | tar -xz -C ~/.local/bin gitleaks
gitleaks version
```

> 選定理由（規約の正本は R15）: 単一 Go バイナリで全リポジトリ（非 Python 含む）で動く・高速・
> staged スキャン・allowlist 可。履歴/PR の検証を重視するなら CI 側で別のスキャナを併用する（②CI 層）。
> `VER` と `ARCH` は releases ページで最新を確認する（asset 名は `gitleaks_<VER>_linux_<ARCH>.tar.gz`）。

## 2. global pre-commit hook（core.hooksPath）

`core.hooksPath` を**グローバル設定**すると、全リポジトリの `.git/hooks` を上書きして共通フックが効く。

```sh
git config --global core.hooksPath <dotfiles が管理する hooks dir>
# その hooks dir に pre-commit を置き、中で:
#   gitleaks protect --staged --redact --no-banner
# 検出時は非 0 で commit を止める（--redact で値はログに出さない）
```

- **トレードオフ**: global `core.hooksPath` は per-repo の `.git/hooks` を**無効化する**。
  `pre-commit` フレームワークを使うリポジトリは、その生成フックを呼べなくなる → 必要なら共通 pre-commit
  から chain する。**既に値が設定されているなら、上書き前に退避/追記の方針を確認する**。
- フック実体（スクリプト）は **dotfiles 側の bin/hooks に置く**。このスキルは「何を・なぜ」だけを持ち、
  配線先パスは対象 dotfiles の関心。
- **harness 層の二重化（任意）**: エージェントの commit を遮断したいなら、エージェント側の PreToolUse
  フック（matcher: Bash, 対象 `git commit`）でも同じ scan を呼ぶ＝git フック未配線のリポジトリでも効く。
  ただしフックの登録先が**アプリの書き換えるユーザー設定**なら、symlink ではなくマージ注入で入れること
  （`reference.md`「配布方式の選び分け」）。

## 3. global secret baseline（core.excludesFile）

追跡前に弾く一次防御（R15 ①）。global ignore に secret baseline を入れる。

```sh
git config --global core.excludesFile <dotfiles が管理する global ignore>
# 中身: .env / *.env* / !.env.example / *.pem / *.key / *.p12 / *credential* / id_rsa*
```

## 4. 検証（効くことを確認 → 後始末）

```sh
# 任意のリポジトリで:
printf 'AWS_SECRET_ACCESS_KEY=AKIAIOSFODNN7EXAMPLEkey1234567890abcdef\n' > /tmp/leak.env
git add -f /tmp/leak.env 2>/dev/null
git commit -m "test" --dry-run   # フックが止めれば OK（実 commit しない）
# 後始末: git reset; rm /tmp/leak.env
```

## 注意

- **強制しない・非破壊**: global 設定は既存を上書きしうる。現状を見せ、合意の上で適用する。
- **既存リポジトリの履歴は別問題**: このスキルが止めるのは*これから*の混入だけ。既に commit 済みのものは
  R15 ④（rotate → 履歴 scrub）。`.gitignore` は**追跡済みファイルには無力**。
- **`--redact` を外さない**: 検出結果に値そのものを出すと、CI ログや端末履歴に二次流出する。