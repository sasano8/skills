---
name: mkdocs
description: MkDocs（Material）の docs サイトと、それを GitHub Pages へ公開する CI を雛形から導入・点検する。PR はビルド検証（--strict）のみ、main への push だけ実公開＝環境保護ルールで CI を割らない安全な guard を正本として持つ。Makefile の docs/docs-serve、docs 依存グループ、mkdocs.yml、pages.yml をひと揃いで提供する。ユーザーが「mkdocs」「ドキュメントサイト」「docs を公開」「GitHub Pages」「ドキュメントを CI で公開」「pages.yml が PR で失敗する」等を求めたときに使う。プロジェクト非依存（Python + uv 前提）。
---

# mkdocs — docs サイトと Pages 公開 CI を整える

**先に同じディレクトリの [`reference.md`](reference.md) を読む。** 品質規約・Makefile / pyproject の一般規約・
「安全な公開 guard」の共通原則はそちらが正本で、ここには書かない。

このスキルの責務は **docs サイト公開という 1 関心だけ**。隣接する関心は持たず、所有者へ委ねる:

- **Makefile / pyproject の一般規約**は `reference.md` が正本。ここは docs 用の差分
  （`docs`/`docs-serve` ターゲット・`docs` 依存グループ）だけを足す。
- **test ゲートの CI**（`make check` を push/PR で回す `ci.yml`）は R17 が持つ。ここが持つのは
  **docs を公開する `pages.yml`** だけ（同じ CI でも関心が違う＝公開 vs テスト）。
- **commit / 作業フロー**は作業フロー側に従う（勝手に commit しない）。

## 公開 guard の本スキル固有の形

共通原則は `reference.md`「安全な公開 guard」。docs の本番条件は **default branch への push**:

1. **deploy は `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`**。
   `github.ref` 単独にしない（PR では `refs/pull/N/merge` で揺れる）。
2. **`environment: github-pages` を持つのは deploy job だけ**、かつ本番条件 guard 配下。
   PR では build（`mkdocs build --strict`）までで検証を終える。
3. **artifact upload も本番条件のみ** — PR では site を作って捨てる。

> 事前設定（1 回だけ）: GitHub の **Settings → Pages → Source = GitHub Actions** を有効化する。
> これが無いと deploy が「Pages not enabled」で失敗する（CI ではなく repo 設定の問題）。

## 手順（点検 → 不足を足す）

1. 対象 repo に下記 5 点があるか点検する: ①`mkdocs.yml` ②`docs/`（最低 `index.md`）③`pyproject` の `docs`
   依存グループ ④Makefile の `docs`/`docs-serve` ⑤`pages.yml`（上記 guard 付き）。
2. 不足・逸脱（特に **deploy guard の欠落・`event_name` 抜け・PR 到達 job の `environment:`**）を
   タスクとして登録し、下記雛形との差分を埋める。既存ファイルは上書きせず差分提示してから直す。
3. ローカルで `make docs`（`--strict` で緑）を確認 → push 後に Actions の Pages 公開を確認。

## リファレンス雛形（あるべき姿の正本）

`<project>` は対象に合わせて置換。

### pyproject.toml — docs 依存グループ

````toml
[dependency-groups]
docs = [
    "mkdocs-material>=9.5",
]
````

### mkdocs.yml

````yaml
site_name: <project>
# repo を持つなら設定しておくと「編集」リンクが出る（任意）
# repo_url: https://github.com/<owner>/<project>

theme:
  name: material
  features:
    - navigation.sections
    - content.code.copy

markdown_extensions:
  - admonition
  - pymdownx.highlight
  - pymdownx.superfences

nav:
  - Home: index.md
````

### docs/index.md（最小）

````markdown
# <project>

ここはドキュメントの入口。`docs/` 配下に Markdown を足し、`mkdocs.yml` の `nav` に並べる。
````

### Makefile — docs ターゲット（`reference.md` の Makefile に追記）

`.PHONY` に `docs docs-serve` を足す。ビルドは `--strict`（警告を失敗扱い＝壊れたリンク等を CI で捕捉）。

````makefile
# docs サイト（MkDocs Material）をビルド。出力 site/ を Pages CI が公開。--strict で警告を失敗に。
docs:
	uv run --group docs mkdocs build --strict

# ローカルでプレビュー（http://127.0.0.1:8000）
docs-serve:
	uv run --group docs mkdocs serve
````

> 公開前に spec 表や API リファレンス等を**生成してから**ビルドしたい repo は、`docs:` の前段に生成ターゲットを
> 依存に足す（例 `docs: gen-spec`）。生成の中身は repo 固有＝各 repo に置く（汎用スキルに実装を書かない）。

### .github/workflows/pages.yml（公開 guard 付き）

````yaml
name: Pages

# docs サイト（MkDocs）を GitHub Pages へ公開する。
# - PR / push: ビルド検証のみ（mkdocs --strict）。
# - main への push のみ: 実公開（環境保護ルールで割れない guard 付き）。
# 事前に Settings → Pages → Source = GitHub Actions を有効化しておくこと。

on:
  push:
    branches: [main]
  pull_request:

# Pages デプロイに必要な最小権限。
permissions:
  contents: read
  pages: write
  id-token: write

# 同時実行は 1 本（進行中の公開はキャンセルしない）。
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install uv
        uses: astral-sh/setup-uv@v6   # Node20 廃止予告に追従して新しめの版を使う
        with:
          enable-cache: true
      - name: Build docs (mkdocs --strict)
        run: make docs
      # PR では site を作って検証するだけ＝公開しない（本番条件のみ artifact 化）。
      - name: Upload Pages artifact
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        uses: actions/upload-pages-artifact@v3
        with:
          path: site

  deploy:
    # ★ 本番条件でのみ実行：event=push かつ main。PR は環境保護に触れない（CI を割らない核）。
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
````

## 注意

- **uv 前提**（R1）。`pip install mkdocs` 等の素の手順は出さない。
- deploy guard の `event_name == 'push'` を**省かない** — `github.ref` だけだと PR で揺れて環境保護に弾かれる
  （このスキルが直す典型事故）。PR から到達する job に `environment:` を置かないこと。
- `mkdocs build --strict` を既定にする（壊れたリンク・nav の不整合を公開前に CI で捕捉する）。
- 公開されない時はまず **repo 設定（Settings → Pages → Source = GitHub Actions）**を疑う（CI ではなく設定）。
