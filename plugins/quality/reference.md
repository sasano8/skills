# quality 共通リファレンス

`audit` / `mkdocs` / `release-pypi` の 3 スキルが共有する定義。
各 SKILL.md はこのファイルを**規約と雛形の正本として参照する**（同じ内容を各 SKILL.md へ再記載しない）。

**いまは Python のみ対応**（他言語は言語別のルール表＋雛形をこのファイルに足して拡張する。スキルは分割しない）。
**uv 前提** — 是正案に `pip` / 素の `python -m venv` を出さない。

## 原則

- **スキャフォルダではない** — 3 スキルとも「あるべき姿との差分を埋める」運用。新規リポジトリは全項目が
  「不在」として挙がるだけで同じ流れに乗る。既存ファイルは上書きせず、差分を提示して合意の上で直す。
- **判断（あるべき姿）はここに集約する** — 各スキルは手順と自分の関心の差分だけを持ち、規約を再記載しない
  （コピペは drift 源）。
- **勝手に commit しない** — 是正後の commit 可否はユーザーに委ねる（commit をフローに組み込む運用は
  作業フロー側の領分）。
- **ルールを安易に緩めない** — 例外が要るなら規約提示の段階で合意してから外す。

## スキル体系

| スキル | 責務 | 持つもの |
| --- | --- | --- |
| `audit` | 規約に照らして監査し、問題点を列挙してタスク化する | 監査手順・レポート様式 |
| `mkdocs` | docs サイトと GitHub Pages 公開 CI を整える | `mkdocs.yml` / `docs` 依存グループ / `docs` ターゲット / `pages.yml` |
| `release-pypi` | 配布物を PyPI へ公開するリリース CI を整える | `build-system` / `build`・`publish` ターゲット / `release.yml` |

`mkdocs` と `release-pypi` は**同じ CI でも関心が違う**（公開 vs テスト）。test ゲートの CI（`make check` を
push/PR で回す `ci.yml`）は **R17** が持ち、この 2 スキルは自分の公開ワークフローだけを持つ。

`audit` は自走しない**オンデマンド監査**。各 repo が自分の開発内ループ（開発 → 自己点検 → commit）から
呼び出す。俯瞰層（複数 repo を束ねる側）が配下を横断監査することはしない — drift が気になれば
各 repo へ「自己点検せよ」と下り dispatch するだけで、実点検はその repo 側で走る。

## 関心の分離（どこに何を書くか）

この規約は『**単体スキル**』＝ お作法（規約・チェックシート・書き方）の自己完結した正本。
**フロー（手順・実行タイミング・優先度・誰がいつ）は持たない** — それは俯瞰層の領分。

- **俯瞰層**: フロー・段取り・横断計画を持ち、単体スキルを呼び出す/参照する。
- **単体スキル**: 自己完結したお作法・知識を持ち、俯瞰層から参照される。**フローを混ぜない**。

その上でここは**一般的な検証方法・チェックシートの正本**（再利用可能・プロジェクト/組織非依存）。
「この組織でどう適用するか」「どの repo を何でチェックするか」は**ここに書かず**、層を分ける:

| 層 | 持ち物 | 例 |
|----|--------|----|
| **quality（このプラグイン）** | 一般的な検証方法・チェックシート（各ルール・雛形） | 「Makefile に `check` を持て」「`make check` が緑」 |
| **組織の品質方針**（作業フローの参照系） | このプラグインを組織にどう適用するか | 俯瞰側の `reference/quality-policy.md` |
| **作業フロー** | 「品質チェックを行う」とだけ言う（規約は持たない） | 切りのいいところで品質チェック → 組織方針に従う |
| **各 repo の技術文書** | 組織方針を materialize した呼び出し | `make check` |

- **スキル / ドキュメントの更新も品質対象**: SKILL.md やドキュメントを更新するときも該当チェック
  （構成・一貫性・参照の妥当性）を参照する。コードだけが品質対象ではない。スキルを増改築するときは、
  この関心の分離を崩していないか（規約の二重持ち・層の越境が無いか）を点検する。

## 品質規約（ルール）

各ルールは「あるべき姿 / 判定方法」を持つ。あるべき姿の具体形は末尾「リファレンス雛形」を正本とする。

| ID | ルール | 判定方法（違反/不在の見つけ方） |
|----|--------|-------------------------------|
| **R1 uv 強制** | 依存管理は uv（`uv sync`/`uv add`/`uv run`、使い捨ては `uvx <tool>@<版>`）。`pip`/素の venv 手順は不可 | `uv.lock` の有無。README/CI/Makefile に `pip install` が無いか。`uv --version` が通るか |
| **R2 pyproject** | `pyproject.toml` が存在し hatchling ビルド。`[project]`（name/version/requires-python/dependencies）が揃う | ファイル有無と必須キー |
| **R3 ruff 設定** | `[tool.ruff] line-length=100`・`target-version="py314"`、`[tool.ruff.lint] select=["E","F","I","UP","B","SIM"]` | 当該節の有無・値 |
| **R4 pytest 設定** | `[tool.pytest.ini_options] testpaths=["tests"] addopts="-ra"`、dev 依存に `pytest>=8.0` | 当該節と dev group |
| **R5 Makefile** | `format`/`format-check`/`lint`/`check` ＋ **`grep-todo`**（作業マーカーを `file:line` で拾う＝R16 を materialize。非ヒットでも exit 0 で CI を割らない）＋ **テスト 4 段**（`test`=fast / `test-heavy`=重い層だけ / `test-benchmark`=性能計測だけ / `test-all`=全部。R13）を提供。**format は `uvx ruff@<固定版>`**（`RUFF_VERSION` で 1 点管理。**py314 対応版**＝0.15+ 目安） | ターゲット有無（`grep-todo`・テスト 4 段 含む）、ruff がピン留めか（`ruff@x.y.z`）、テスト段が R13 のマーカー分離（`not slow and not benchmark` 等）に対応するか |
| **R6 src レイアウト** | ソースは `src/<package>/`、wheel packages は `["src/<package>"]`、`tests/` 分離 | ディレクトリ構成、`[tool.hatch.build.targets.wheel]` |
| **R7 .gitignore** | `.venv/` `__pycache__/` `.pytest_cache/` `.ruff_cache/` `dist/`/`*.egg-info/` を無視（シークレットは R15） | 当該エントリ |
| **R8 検証緑** | `make check`（`format-check` + `test`）が緑 | 実行結果。落ちる箇所が是正対象 |
| **R9 Python 3.14+** | `requires-python=">=3.14"`。3.14 は注釈遅延評価（PEP 649）が既定＝**`from __future__ import annotations` を書かない**（自クラス等への前方参照はそのまま valid）。ruff は py314 対応版＋`target-version="py314"` | `requires-python` の値、`from __future__ import annotations` の混入、ruff 版/`target-version` |
| **R10 検証規約の取り込み** | 作業フロー基盤（Memory Bank 等）を使う repo は、その技術文書の「検証コマンド」節が **この規約を参照し materialize**（`make check` 等の Makefile 呼び出し）していること。生 `uvx ruff …` のベタ書きや、R5/R8 と drift した記述が無い | 技術文書の「検証コマンド」節を確認（quality への言及・`make` 経由・ベタ書き不在）。**点検は各 repo の自己点検 1 本**（開発内ループからこの規約を参照して走る）。俯瞰層は「自己点検せよ」と下り dispatch するだけで、横断直参照・横断定期監査はしない |
| **R11 ドキュメント/スキルの書き方** | SKILL.md・README・設計文書が「ドキュメントの書き方」（自己完結／体系→詳細／核外は参照へ逃がす）に沿う。書きにくさ・重複・肥大は文章だけでなくスキル構造の歪みも疑う。**単体スキルにフロー（手順・タイミング・優先度）が混入していないか**も見る。さらに **汎用スキル（「プロジェクト非依存」を宣言するもの）に、特定プロジェクトの固有実装名・パス・literal をハード参照していないか**（正本は宣言側。具体は個別層・参照系へ逃がす） | 当該文書を「ドキュメントの書き方」「関心の分離」節に照らして判定。判断系のため重大度は文脈依存。**対象は自リポ/統治下のスキル・文書のみ**（外部スキルは統治外＝規約対象外）。種別は名前のプレフィックスではなく frontmatter で宣言（R12）し、ここでは*中身*の一貫性を見る。ハード参照は、プロジェクト非依存を謳うスキル本文を固有名（実装スクリプト名・リポ固有/絶対パス・プロジェクト名）で grep して検出する |
| **R12 ドキュメントメタデータ（OKF）** | 統治下のスキル文書（`SKILL.md`）は **OKF（Open Knowledge Format）準拠の frontmatter** を持つ。**必須: `type`**（その文書の種別を表す。**取りうる値はそのプロジェクトの taxonomy が定める**＝OKF は producer 裁量・中央レジストリ無し。具体値は宣言側＝各プロジェクトの統治文書が持ち、この規約は literal を持たない）。既存の `name` / `description` は loader 必須として維持（OKF の `title` / `description` 役）。`tags` / `timestamp` 等は任意。OKF は consumer が**未知キーを拒否しない**＝拡張自由 | frontmatter に `type` があり、そのプロジェクトの taxonomy が定める値のいずれかか。`name`/`description` の欠落が無いか。**対象は自リポ/統治下のスキル文書のみ** |
| **R13 テスト実行時間の規律** | **高速にテストを回せること自体を品質とみなす**。テストを **4 段に分離**: `test`=fast（内ループ既定＝`-m "not slow and not benchmark"`）/ `test-heavy`=重い層だけ（実バックエンド・ネットワーク・sleep/ポーリング＝`@pytest.mark.slow`）/ `test-benchmark`=性能計測だけ（`@pytest.mark.benchmark`）/ `test-all`=全部。マーカー `slow`・`benchmark` を pyproject に登録する。**未整備・未実装で失敗/タイムアウトが既知の依存は、待たずに早期 skip** — 軽い可用性チェック＋`pytest.skip`/`@pytest.mark.skipif` で**接続を試みる前に判定**する（タイムアウトしてから SKIP は遅く、内ループを毎回鈍らせる＝アンチパターン） | `slow`・`benchmark` マーカが pyproject の `markers` に登録され該当テストに付与されているか。Makefile が 4 段で、`test`(=fast) が `-m "not slow and not benchmark"` か（R5）。未整備依存が **timeout 経由でなく** skipif 等で早期 skip されるか |
| **R14 設計の残し方** | 設計はソース構造・命名・テストで語らせ、**文章は最後の手段**（陳腐化・drift 源）。「設計の残し方」節（構造>命名>テスト>文章、簡潔最優先、YAGNI、具体名でなく層/役割で参照=R11、単一の正本）に沿う | 「設計の残し方」節に照らす。判断系＝重大度は文脈依存。構造/命名で配置が予測可能か、文章に過剰な意図を残していないか、具体名ハード参照（R11）や設計の二重持ちが無いか |
| **R15 シークレットを commit しない** | `.env`・鍵・認証情報をリポジトリに入れない。多層防御で守る: ①`.gitignore` に secret baseline（`.env` `*.env*`＋`!.env.example`、`*.pem` `*.key` `*.p12` `*credential*` `id_rsa*` 等）。②値は `.env`(ignore) と `.env.example`(committed・値なし) に分離。③混入検知は **pre-commit / CI のシークレットスキャン**（gitleaks 等）。④**漏れたら rotate（失効扱い）→ 履歴 scrub**（git filter-repo / BFG）— `.gitignore` は追跡済みファイルには無力。具体機構（スキャナ導入・global hook 配線）は個別層に置く（汎用スキルに実装を書かない＝R11） | `.gitignore` に secret baseline があるか。追跡ファイルに `.env`/鍵/credential が無いか（`git ls-files \| grep -iE`）。scan が pre-commit か CI に在るか |
| **R16 タスクの残し方（inline マーカー）** | コードに紐づく**未了作業**は、その場に **`<マーカー>(<backlog-id>): <what> — <why/条件>`** で残す＝作業を**属するコードの隣**に置き grep で拾える（R14「ソースに語らせる」の延長。ただし設計意図ではなく*未了作業のアンカー*なので R14 とは別物）。**`<backlog-id>` は backlog の行 id（または issue 番号）**で追跡可能にし**孤児を防ぐ**。純粋 WIP/一時の未了のみ無印可＝ただし**コミット境界で解消 or backlog 昇格**。**マーカーは行コメントに置く**（docstring 内の散文は grep に乗らない＝不可）。種別: 未了 / 既知の不具合 / 意図的回避 の 3 種（具体の綴りは R5 の `grep-todo` が拾うもの）。**横断的・コードに未着地・トリアージが要る・dispatch 由来**の作業は inline にせず作業フロー側の受信箱/バックログへ寄せる（単一窓口・監査証跡を薄めない）。**腐らせない** — 長寿命化・横断化したものは backlog へ昇格して inline から消す（化石化防止＝YAGNI / dedup）。sweep は **`make grep-todo`（R5）**で拾う。拾う**タイミングは作業フロー側の領分**＝このルールは書式と棲み分けだけを定める | **`make grep-todo`（R5）**で書式が揃い what が一言あるか（空・暗号的なものが無いか）、**id リンクの有無・id が backlog に実在するか（孤児）・docstring 散文マーカー**を検出。**横断・長寿命なのに inline に放置された化石**、**コード未着地/dispatch 由来なのに単一窓口をすり抜けて inline 化した作業**が無いか |
| **R17 CI が品質ゲートを回す** | 品質ゲートを **CI で自動実行**する（人手の `make check` 忘れに依存しない＝ゲートを機械で担保）。最低限 push / PR で **`make check`**（`format-check` + fast `test`）を回す。重い層（`test-heavy` / `test-benchmark`）は実サービス・計測環境を要するので、その足回りがある repo だけ job を足す（無い repo は fast ゲートのみで可＝段階導入）。**デプロイ・公開系は本番条件でのみ実行し PR を割らない**（下記「安全な公開 guard」）。CI 定義（ワークフロー yaml）は個別実装＝具体は各 repo に置き、このルールは要件だけを持つ（R11）。雛形は末尾「CI ワークフロー」。docs サイトの公開 CI は `mkdocs` スキル、PyPI への公開 CI は `release-pypi` スキルが持つ | `.github/workflows/`（等）に CI があり push/PR で `make check` 相当を回すか、fast ゲートが緑か。デプロイ job が本番条件 guard を持ち PR で `environment:` を踏まないか。重い層を持つ repo はそれ用の job/サービスがあるか |

> ルールの適用対象は**自リポ/統治下のみ**。外部から取り込んだスキル・依存は統治外＝規約対象外。

## 安全な公開 guard（`mkdocs` / `release-pypi` の共通核）

デプロイ・公開系の CI でいちばん壊れやすいのが **PR で公開 job が環境保護ルールに弾かれて CI が赤くなる**
事故。`environment:` に「特定の ref からのみ可」の保護を付けていると、PR から到達する job は
**job-setup 時点で失敗**する（`if` で skip しきれていないと steps 0 個で落ちる）。これを構造で防ぐ:

1. **公開は本番条件でのみ走らせる** — `if` に **`github.event_name == 'push'` を必ず AND する**。
   `github.ref` 単独で判定しない（PR の `github.ref` は `refs/pull/N/merge` で揺れる＝event で判定するほうが堅い）。
2. **PR から到達する job に `environment:` を置かない** — `environment:` を持つのは公開 job だけ、かつその
   job は本番条件 guard 配下。PR ではビルド検証までで終える。
3. **成果物のアップロードも本番条件のみ** — PR では作って捨てる（公開しない）。
4. **最小権限** — top-level は `contents: read` に留め、公開に要る権限（`id-token: write` 等）は公開 job だけに与える。

本番条件の具体形は公開先で違う（`mkdocs` は default branch への push、`release-pypi` は `v*` タグの push）。
各スキルがその差分を持つ。**公開されないときは、まず CI ではなく repo/サービス側の設定を疑う** —
これも両スキル共通の勘所。

## 監査レポート様式（問題点の列挙）

```markdown
## 品質監査: <project>（規約: quality / Python）

| # | ルール | 現状 | あるべき姿 | 重大度 | 是正方針 |
|---|--------|------|-----------|--------|---------|
| 1 | R5 Makefile | format が素の `ruff`（未ピン） | `uvx ruff@<版>` に固定 | 中 | RUFF_VERSION 導入 |
| 2 | R6 src    | パッケージが直下 | `src/<pkg>/` へ移動 | 高 | 移動＋wheel packages 更新 |

→ 上記をタスク化して処理する。
```

是正は **粒度を 1 ルール（または 1 ファイル）単位**でタスクに割る。依存関係（例: R6 移動 → R4 testpaths）が
あれば順序を明示する。

## 設計の残し方（structure-first）

設計は**まずソースの構造で語らせる**。どこに何があるかが構造から予想でき、命名が意図を表すなら、文章は
要らない。文章は陳腐化する（黙って腐る）が、構造・命名・テストは**壊れて見える**。ゆえに設計の置き場は
**構造 > 命名 > テスト > 文章** の優先で、**文章は最後の手段**。通底するのは **簡潔** — 足すより削る。

- **構造優先** — ディレクトリ/モジュール境界・依存方向で「どこに何があるか」を予測可能にする。構造が設計を語る。
- **ソースを拡充** — 設計の厚みは文章でなくソース側に置く（命名・型・境界・テスト）。
- **命名で意図を表す** — 名前で what を伝え、コメント/文章を不要にする。コメントを書くなら「なぜ」に限る。
- **テスト＝実行可能な意図** — 仕様は腐らない実行可能な形（テスト）で残す。文章の仕様より壊れて見える。
- **文章は最小限** — 必要以上に意図をドキュメントに残さない。残すのは構造・命名・テストで表せない「なぜ」だけ。
- **具体名参照を避ける** — 置換が要るから。参照は**層・役割で指す**（リネーム耐性＝R11）。
- **単一の正本** — 同じ設計を二箇所に書かない（drift 源）。
- **YAGNI** — 使わない設計を先回りで残さない。簡潔最優先。

> ここは「**そもそも文章を書くべきか**（→構造・命名・テストで足りないか）」を問う節。書くと決めた文章の
> 書き方は次節。設計の置き場 → 書き方 の順で読む。

## ドキュメントの書き方

SKILL.md・README・設計メモなど**文章**の品質規約。コードと同じく「読み手が最短で正しく理解できるか」で見る。

1. **自己完結を優先** — 知識はできるだけ**その文章の中で完結**させる。読み手が他所を何度も往復しないと
   理解できない書き方を避ける（リンク追跡＝知識の分断・読解コスト）。
2. **体系 → 詳細にブレークダウン** — 知識量が多いときは **体系的（俯瞰・原則）→ 詳細（具体・手順）** の順に
   段階を作る。冒頭で全体像と要点、深掘りは後段・小節へ。読み手は必要な深さで読み止められる。
3. **核から外れるものは参照に逃がす** — 本文にはその文章の**ドメインの核となる関心**だけを置き、それ以外
   （別ドメイン・別レイヤの詳細）は**参照**で逃がす。「**核は完結・周辺は参照**」＝自己完結（1）と分量制御を両立させる。
4. **構造が悪いときはスキルも疑う** — 文章が書きにくい・肥大する・重複する・どこに書くか迷うときは、
   **文章そのもの**だけでなく、それを規定する**スキルの構造**が悪い可能性を疑う（関心の分離の崩れ／レイヤ
   配置の誤り）。直すべきが個別文章ではなくスキル側のこともある。

> **読み方は書き方の鏡（最小限）** — 読み手は基本 **俯瞰→局所**（構造・要点 → 詳細＝上の体系→詳細の鏡）。
> 方向は目的で選ぶ: 全体像づくりは依存の**順流（上流→下流）**、原因追跡は**逆流（下流→上流）**。ただし
> 適応的な読み自体は LLM が得意なので**読み方のアルゴリズムは規定しない** — お作法として効くのは**書く側**:
> これらの読み経路が成立するよう構造化する。

## deep think（俯瞰品質ゲートの算法）

作業範囲**全体**が品質ガイドラインに俯瞰で沿うかを**深く考える**ための算法。各開発ステップ内の
**per-iteration 自己点検（局所・スピード重視）とは別レイヤ**で、より高い視座から「この範囲はそもそも規約に
沿っているか」を問う。ここは**この考え方（算法）の正本**だけを持つ — **いつ／どこで呼ぶか（ゲート配置・
戻し回数・WIP 退避）は作業フロー側の領分**（単体スキルにフローを混ぜない）。

固定のチェックリストでは縛らない（適応的に考えるのは LLM が得意＝「読み方のアルゴリズムは規定しない」と
同じ思想）。規定するのは **観点と姿勢**の 2 つだけ:

1. **俯瞰観点を当てる** — 作業範囲を規約・お作法に俯瞰で照らす。観点は網羅でなく出発点:
   - **スコープ適合** — 規約のスコープ内か。やりすぎ（範囲外）・やり残しがないか。
   - **関心の分離** — 俯瞰層/単体スキルの混在、規約の二重持ち（drift 源）、層越境がないか（R11）。
   - **自己完結と参照** — 核は完結・周辺は参照に逃がせているか。
   - **ハード参照** — 汎用スキルに固有実装名・パス・literal が混入していないか（R11）。
   - **検証規約の取り込み** — 技術文書がこの規約を materialize しているか（R10）／`make check` 緑（R8）。
2. **反証する（adversarial）** — 各観点で「**この計画／成果は規約のどこに反しうるか**」を**能動的に探す**。
   受け身の確認でなく、自分の計画・成果の破れを自分で突く。反例が出たら是正、または計画へ戻す。

- **着手前（計画整理）** は設計レベルで反証する（これから作る範囲が規約に沿う計画か）。**コミット前（最終点検）**
  は成果物で反証する（出来たものが規約に沿うか）。
- **重さは範囲に比例**させる — deep think は重い。範囲が小さいほど観点を絞って軽く考える。
  per-iteration 自己点検（局所/速）と混同しない。

---

## リファレンス雛形（あるべき姿の正本）

`<name>` / `<package>` / `<project>` は対象に合わせて置換。各スキル固有の雛形は各 SKILL.md にある。

### pyproject.toml

````toml
[project]
name = "<name>"
version = "0.0.1"
description = ""
requires-python = ">=3.14"
dependencies = []

[dependency-groups]
dev = [
    "pytest>=8.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/<package>"]

[tool.ruff]
line-length = 100
target-version = "py314"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM"]

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-ra"
# テスト 4 段（R13）のマーカー。該当が無い repo でも登録だけしておく（PytestUnknownMarkWarning 回避）。
markers = [
    "slow: 実バックエンド/ネットワーク/ポーリング待ちを伴う重いテスト",
    "benchmark: 性能計測（ベンチマーク）",
]
````

> `uv sync` がプロジェクトを editable で入れるため、`src` レイアウトでも `tests` から
> `import <package>` できる（`pythonpath` 設定は不要）。

### Makefile

`format` は **`uvx ruff@<固定版>`**。バージョンは先頭の `RUFF_VERSION` だけ変えれば全体に反映。

````makefile
# <project> — 開発タスク
# format は uvx で ruff のバージョンを固定して実行する（環境差を排除）。

# ruff のピン留めバージョン（更新時はここだけ変える。py314 対応版＝0.15+ 目安）
RUFF_VERSION := 0.15.18

# lint/format/test の対象
SRC := src tests

.PHONY: format format-check lint test test-heavy test-benchmark test-all check grep-todo

# コード整形（自動修正）
format:
	uvx ruff@$(RUFF_VERSION) format $(SRC)
	uvx ruff@$(RUFF_VERSION) check --fix $(SRC)

# 整形確認のみ（CI 向け・書き換えない）
format-check:
	uvx ruff@$(RUFF_VERSION) format --check $(SRC)
	uvx ruff@$(RUFF_VERSION) check $(SRC)

# lint のみ
lint:
	uvx ruff@$(RUFF_VERSION) check $(SRC)

# テスト 4 段（R13）。マーカー slow / benchmark は pyproject に登録しておく。
test:                      # fast（内ループ既定）＝ slow も benchmark も除外
	uv run pytest -m "not slow and not benchmark"

test-heavy:                # 重い層だけ（実バックエンド・ネットワーク・ポーリング待ち）
	uv run pytest -m "slow"

test-benchmark:            # 性能計測だけ
	uv run pytest -m "benchmark"

test-all:                  # 全部（CI / 明示時）
	uv run pytest

# 一括検証（format 確認 + fast test）＝内ループの「検証緑」判定
check: format-check test

# 作業マーカーを file:line で拾う（R16）。非ヒットでも exit 0（CI を割らない）
grep-todo:
	@grep -rnE 'TODO|FIXME|HACK' $(SRC) --include='*.py' || true
````

`mkdocs` / `release-pypi` は、この Makefile へ自分のターゲットを**追記**する（別 Makefile を作らない）。

### テストの軽重分離（R13）— マーカーの付け方と早期 skip

4 段の Makefile と マーカー登録は**上記の Makefile・pyproject 雛形が正本**（ここで再掲しない＝drift 防止）。
本節はマーカーの**付け方**と**未整備依存の早期 skip**（タイムアウト待ちにしない）だけを示す。

````python
# 重いテストは slow を付ける（test-heavy / test-all で走る）
@pytest.mark.slow
def test_real_backend_roundtrip(): ...

# 性能計測は benchmark を付ける（test-benchmark / test-all で走る）
@pytest.mark.benchmark
def test_throughput(): ...

# 未整備/未実装で失敗が既知の依存は「接続を試みる前」に早期 skip（timeout 待ちにしない）
import shutil, pytest

@pytest.mark.skipif(shutil.which("some-backend") is None, reason="backend 未整備")
def test_needs_backend(): ...

# 動的判定が要るときも、重い接続の前に軽くプローブして skip する
def test_s3_virtual(s3_env):
    if not s3_env.available:          # 軽い可用性チェック（接続/認証の本処理前）
        pytest.skip("s3-virtual: 環境/認証 未整備")
    ...
````

> アンチパターン: 実接続を試して **TimeoutError まで待ってから SKIP**。待ちぶんだけ内ループが鈍る。
> 「未整備なら早く skip」を可用性チェックで前倒しする。

### .gitignore

````gitignore
# Python
__pycache__/
*.py[cod]
.pytest_cache/
.ruff_cache/

# venv / uv
.venv/

# build
dist/
build/
*.egg-info/

# secrets（R15）— 値は .env(ignore) / .env.example(committed・値なし) に分離
.env
*.env
!.env.example
*.pem
*.key
*.p12
*credential*
id_rsa*
````

### CI ワークフロー（R17）— 品質ゲートを機械で回す

push / PR で `make check`（format-check + fast test）を回す最小 CI。GitHub Actions の例。重い層
（`test-heavy` / `test-benchmark`）は実サービス・計測環境が要るので、足回りがある repo だけ job を足す。
**docs サイトの公開 CI は `mkdocs`、PyPI への公開 CI は `release-pypi`**（この節は test ゲート）。

````yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install uv
        uses: astral-sh/setup-uv@v6   # Node20 廃止予告に追従して新しめの版を使う
        with:
          enable-cache: true
      - name: Lint & format check & fast test
        run: make check
````

> 重い層を CI で回す repo は、サービス（`services:` や `docker compose`）を立ててから `make test-heavy` を
> 別 job/別ステップで回す（fast ゲートと分け、内ループの速さを CI 構成に持ち込まない）。`test-benchmark` は
> 計測が主目的＝gate にせず情報収集に留めるのが無難（環境差で揺れるため）。

### 最小レイアウト（新規時）

```
<project>/
├── pyproject.toml
├── Makefile
├── README.md
├── .gitignore
├── .github/workflows/ci.yml     # R17: push/PR で make check
├── src/<package>/__init__.py    # __version__ = "0.0.1"
└── tests/test_smoke.py          # import <package>; assert <package>.__version__
```

## 注意

- **uv 必須。** 是正案に `pip` / 素の `python -m venv` を出さない。
- 既存ファイルは上書きせず、監査で差分提示 → タスクとして合意の上で直す。
- ruff のピン版は「最新安定版を 1 つ選んで固定」。存在しないバージョンを書くと R8（`make check`）で落ちる。
- **Python 3.14+ 前提（R9）**: `from __future__ import annotations` は書かない（3.14 は注釈遅延評価が既定で
  前方参照は valid）。ruff は `target-version="py314"` が通る版（0.15+ 目安）を選ぶ。0.9 系は py314 未対応で
  設定パース時に落ちる。なお「不要な future import」を自動で消す lint ルールは無い＝R9 は config
  （`target-version`/`requires-python`）とこの規約で担保する（監査時に grep で混入を確認）。
