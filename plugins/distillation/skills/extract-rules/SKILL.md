---
name: extract-rules
type: func
description: コードファーストで対象プロジェクトのコードを読み、そこから規則・慣習・パターンを抽出（蒸留）して、他プロジェクトでも流用できるスキル草稿を .cache/distillation/<target>/skill/ に生成・更新する。コードから推測した規則（distilled）とユーザーが強制する規則（rule）を provenance で分け、根拠（file:line）と確度を添える。再実行時はコードとの差分で更新する。ユーザーが「規則を抽出」「規約をスキル化」「コード規約をまとめて」「コードから規約を抽出」「蒸留して」「distill」等を求めたときに使う。プロジェクト非依存。
---

# extract-rules — コードから規則を蒸留してスキル草稿にする

**先に同じディレクトリの [`reference.md`](reference.md) を読む。** 原則・ディレクトリ体系・config と
scope・モード・設計の根拠はそちらが正本で、ここには書かない。

このスキルの責務は**規則の抽出と草稿の生成だけ**。読解中に気づいた課題の起票は `extract-issues`、
ソースへの還流は `merge-issues` が持つ。

## 手順

1. **scope 確定** — `reference.md`「config と scope」のとおり config を読む／初回は仮 config で走る。
2. **読解** — scope.code を読み、命名・レイアウト・エラーハンドリング・依存の使い方・テストの流儀など、
   コードから推測できる規則を抽出する。scope.docs は裏取り・背景の補助に使う。
3. **草稿生成** — テーマごとに `skill/<name>/SKILL.md` を生成する（Agent Skills 標準:
   frontmatter `name` + `description`）。テーマ名は下記の**統制語彙**から選ぶ（テーマはシノニムが
   出やすいのでスキル側で語彙を管理し、target・プロジェクトを跨いで一貫させる。該当が無いときだけ
   新語を使い、その旨を草稿に注記する）:

   > テーマ統制語彙: naming（命名）/ layout（配置・構成）/ error-handling（エラー処理）/
   > dependencies（依存の使い方）/ testing（テストの流儀）/ ci-release（CI・リリース）/
   > docs（ドキュメント）/ config（設定の持ち方）/ security（秘密情報・権限）/ api-design（IF 設計）

   各規則に **provenance と根拠**を付ける:

   ```markdown
   ---
   name: <対象プロジェクト>-<テーマ>
   description: <この草稿が何の規約か・いつ使うか>
   distilled_from:        # 蒸留元のスナップショット（config の scope を転記）
     code: [src/]
     docs: [README.md]
   updated: <yyyy-mm-dd>
   ---
   ## 規則
   - [distilled] <規則>（根拠: <file:line> / <観察したパターン>）
   - [distilled:low] <確度の低い規則>（確度は low|med|high。low は原則、課題へ回して判断を仰ぐ）
   - [rule] <ユーザーが強制したい規則>（由来: ユーザー指定 <yyyy-mm-dd>）
   ```

4. **再実行時** — 既存草稿を読み、コードとの差分（規則の変化・根拠の消失）を反映して更新する。
   ユーザー定義の `[rule]` 行は蒸留で消さない（変更はユーザー合意時のみ）。
5. **提示** — 生成/更新した草稿と、初回なら scope の確認をユーザーへ求める。

> 草稿は**対象プロジェクトの固有名を含んでよい**（それが成果物）。別プロジェクトへ流用するときに
> 固有部分を汎化するのは持ち出し先での作業。

<!-- TODO: [distill:export-checklist:deferred]: 持ち出し（汎化）チェックリスト節の追加は保留（2026-08-09 ユーザー判断） -->

## extract-issues との関係

読解の中で規則に落ちない歪み（コードとドキュメントの矛盾・怪しい実装・設計の不備）に気づくのは
自然なことだが、**このスキルは課題票を書かない**。確度 low の規則や気づいた歪みは、`extract-issues`
へ回す。読解が済んだ直後に続けて実行するのが効率的なので、最後にそれを提案する。