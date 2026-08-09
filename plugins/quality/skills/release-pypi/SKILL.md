---
name: release-pypi
description: Python パッケージを PyPI へ公開するリリース CI を雛形から導入・点検する。PR はビルド検証のみ、`v*` タグの push のときだけ実公開＝tag↔pyproject version の一致を CI で検証し、通れば（テスト緑で）そのまま自動公開する。Trusted Publishing（OIDC）既定＝API トークンを repo に置かない／環境保護ルールで CI を割らない安全な guard を正本として持つ。Makefile の build/publish、build-system、release.yml をひと揃いで提供する。ユーザーが「PyPI に公開」「pypi にアップロード」「リリース CI」「パッケージ公開」「Trusted Publishing」「タグでリリース」「release を整える」等を求めたときに使う。プロジェクト非依存（Python + uv 前提）。release-<lang> ファミリの Python 版（npm 等は別スキル）。
---

# release-pypi — Python パッケージを PyPI へ公開するリリース CI を整える

**先に同じディレクトリの [`reference.md`](reference.md) を読む。** 品質規約・Makefile / pyproject の一般規約・
「安全な公開 guard」の共通原則はそちらが正本で、ここには書かない。

`release-<lang>` ファミリの **Python 版**（言語ごとに別スキルとして切る。公開先・ビルド系・guard の作法が
言語で違うため＝1 関心 1 スキル）。

このスキルの責務は **PyPI への配布物の公開という 1 関心だけ**。隣接する関心は持たず、所有者へ委ねる:

- **Makefile / pyproject の一般規約**（`build-system`=hatchling・src レイアウト 等）は `reference.md` が正本。
  ここは release 用の差分（`build`/`publish` ターゲット・dist 検証）だけを足す。
- **test ゲートの CI**（`make check` を push/PR で回す `ci.yml`）は R17 が持つ。ここが持つのは
  **配布物を公開する `release.yml`** だけ。docs 公開は `mkdocs` スキル。
- **シークレット混入防止のグローバル足回り**は個別層（マシン環境の配線）。ここは Trusted Publishing を
  既定にして**そもそも API トークンを repo に置かない**ことで、R15 の方針に整合させる。
- **commit / バージョン上げの段取り**は作業フロー側に従う（勝手に commit / tag しない）。

## 公開 guard の本スキル固有の形

共通原則は `reference.md`「安全な公開 guard」。リリースの本番条件は **`v*` タグの push**:

1. **API トークンを置かない＝Trusted Publishing（OIDC）を既定**にする。`pypa/gh-action-pypi-publish` が
   GitHub の OIDC トークンを PyPI に提示して公開する＝**`secrets.PYPI_API_TOKEN` を repo に保存しない**
   （漏洩面をゼロにする）。そのために **publish job だけに `id-token: write`** を与える。
2. **`release.yml` は `v*` タグの push でだけ走らせる** — `on: push: tags: ['v*']`（通常ブランチ/PR では
   発火しない）。リリースの起点を `v*` タグの push に一本化する＝**タグを打つ → 検証が通れば（テスト緑で）
   そのまま自動公開**（GitHub Release の手動 publish を挟まない一本道）。継続的な test は R17＝`ci.yml` が
   全ブランチで担保し、`release.yml` はリリース専用＝**通常ブランチ/PR で配布物 build を走らせない**。
   guard は `if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')`。
3. **`environment:` を持つのは publish job だけ** — かつ本番条件 guard 配下。環境保護ルール（`pypi` 環境を
   tag/default branch からのみ許可）に整合させ、リリース以外の経路から `environment:` を踏ませない。
4. **同一バージョンの再公開で落ちない＝手書き version × tag 一致検証** — PyPI は既存 version の上書きを拒否する。
   version は `pyproject` に手書きし、publish 前に **タグ（`v<version>`）と `pyproject` の `version` の一致を検証**
   して上げ忘れ・不一致を公開前に弾く（**このスキルの統一パターン**＝動的生成を使わず version を明示しつつ
   二重管理事故をゼロにする）。
5. **リリース前にテストを通す** — publish の前提として build job で `make check` を回し、**壊れたコードを
   publish しない gate** にする（継続的な全ブランチ test は R17 の領分。こちらは publish 直前の最終 gate＝関心が違う）。

> 事前設定（1 回だけ）: PyPI の **Account → Publishing → Add a pending publisher** で、対象 repo・
> workflow 名（`release.yml`）・environment 名（`pypi`）を登録する。これが無いと OIDC 公開が
> 「Trusted publisher not configured」で失敗する（CI ではなく PyPI 側の設定）。
> GitHub 側は **Settings → Environments → `pypi`** を作り、保護ルール（tag / default branch のみ）を付ける。

## 手順（点検 → 不足を足す）

1. 対象 repo に下記 4 点があるか点検する: ①`pyproject` の `[build-system]`（hatchling）と `[project] version`／
   パッケージ指定（src レイアウト） ②Makefile の `build`/`publish` ③`release.yml`（上記 guard 付き）
   ④PyPI / GitHub の事前設定（pending publisher・`pypi` environment）。
2. 不足・逸脱（特に **publish guard の欠落・`event_name` 抜け・PR 到達 job の `environment:`・
   API トークン直書き・version 一致チェックの欠落**）をタスクとして登録し、雛形との差分を埋める。
   既存ファイルは上書きせず差分提示してから直す。
3. ローカルで `make build`（`dist/` に sdist+wheel が出て `twine check` が緑）を確認 →
   `pyproject` の version を上げて `git tag v<version>` を push し Actions の検証→公開を確認
   （最初は **TestPyPI** で素振りすると安全＝下記「注意」）。

## リファレンス雛形（あるべき姿の正本）

`<project>` / `<package>` は対象に合わせて置換。

### pyproject.toml — build-system（`reference.md` の pyproject に既存。無ければ足す）

````toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/<package>"]
````

### Makefile — build / publish ターゲット（`reference.md` の Makefile に追記）

`.PHONY` に `build publish` を足す。`publish` は **CI（Trusted Publishing）が正路**で、ローカルは
非常用フォールバック（uv が対話的にトークンを尋ねる）。**`build` が既に別用途で使われている repo は
`dist` 等にリネーム**して衝突を避ける（`release.yml` の呼び出しも合わせる）。

````makefile
# 配布物（sdist + wheel）を dist/ にビルドし、メタデータを検証（壊れた配布を公開前に弾く）。
build:
	rm -rf dist
	uv build
	uvx twine@6 check dist/*

# 非常用フォールバックの手動公開（正路は CI の Trusted Publishing）。トークンは対話入力させる。
publish: build
	uv publish
````

### .github/workflows/release.yml（公開 guard 付き）

````yaml
name: Release

# Python パッケージを PyPI へ公開する。
# - v* タグの push のときだけ実行: tag↔version 一致を検証 → テスト → ビルド → そのまま PyPI 公開。
#   通常ブランチ/PR では走らない（テストは ci.yml が全ブランチで担保＝こちらはリリース専用）。
# 事前に PyPI 側で pending publisher（repo / release.yml / environment=pypi）を登録しておくこと。
#
# リリース手順: ① pyproject の version を上げてコミット ② git tag v<version> を push（検証が通れば自動公開）。

on:
  push:
    tags: ['v*']

# top-level は最小権限。OIDC に必要な id-token は publish job だけに与える。
permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install uv
        uses: astral-sh/setup-uv@v6   # Node20 廃止予告に追従して新しめの版を使う
        with:
          enable-cache: true
      # タグ push のときだけ tag 名と pyproject の version 一致を検証（上げ忘れ・不一致を公開前に弾く）。
      - name: Verify version matches tag
        if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')
        run: |
          tag="${GITHUB_REF_NAME#v}"
          ver="$(uv version --short 2>/dev/null || grep -m1 '^version' pyproject.toml | cut -d'"' -f2)"
          test "$tag" = "$ver" || { echo "tag=$tag != version=$ver"; exit 1; }
      # リリース前にテスト（format-check + test）を必ず通す＝壊れたコードを publish しない gate。
      - name: Lint & format check & test
        run: make check
      - name: Build sdist + wheel (+ twine check)
        run: make build
      - name: Upload dist artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  publish:
    # ★ 本番条件でのみ実行：v* タグの push のときだけ。PR は環境保護に触れない（CI を割らない核）。
    if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: pypi
      url: https://pypi.org/p/<project>
    permissions:
      id-token: write   # Trusted Publishing（OIDC）に必須。トークンは保存しない。
    steps:
      - name: Download dist artifact
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - name: Publish to PyPI (Trusted Publishing)
        uses: pypa/gh-action-pypi-publish@release/v1
````

## 注意

- **uv 前提**（R1）。`python -m build` / `pip install twine` 等の素の手順は出さない
  （ビルドは `uv build`、使い捨ては `uvx twine@<版>`）。
- **`release.yml` は `on: push: tags: ['v*']` だけにする** — 通常ブランチ/PR では配布物 build を走らせない
  （PR で build は不要。test は `ci.yml` が全ブランチで担保＝関心が違う）。publish guard は念のため
  **`event_name == 'push' && startsWith(github.ref, 'refs/tags/v')`** の AND 形で防御する。
- **version は手書き＋CI で tag 一致検証**（動的生成＝hatch-vcs 等は使わない）。version を明示しつつ
  二重管理事故をゼロにする統一パターン。`v<version>` タグを打つと一致検証が通れば自動公開される。
- **API トークンを secrets に置かない** — Trusted Publishing（OIDC）が既定。どうしてもトークン運用が要る
  repo（self-hosted index 等）だけ例外とし、その場合も `environment` 保護下の job に限定する。
- **最初の 1 回は TestPyPI で素振り**すると安全（`gh-action-pypi-publish` に
  `with: repository-url: https://test.pypi.org/legacy/` を付けた別 job／別 environment で確認 → 本番へ）。
- 公開されない時はまず **PyPI 側の pending publisher 登録**と **GitHub の `pypi` environment** を疑う
  （CI ではなく設定の問題＝`mkdocs` の「Pages 設定を疑う」と同じ勘所）。
