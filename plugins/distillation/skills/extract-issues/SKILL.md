---
name: extract-issues
type: func
description: コードファーストで対象プロジェクトのコードを読み、まだ起票されていない課題（非互換 / バグ / リファクタリング / 設計不備）を抽出して workspaces/distillation/<target>/issue/ の課題票に起票する。ソース中の既存タグと open 課題を突き合わせて重複起票を避け、起票した課題の対応方針をユーザーへ尋ねる。ユーザーが「課題を抽出」「未起票の課題を洗い出して」「課題を起票」「バグや設計の問題を探して」「issue を作って」等を求めたときに使う。プロジェクト非依存。
---

<!-- TODO: [distill:skill-frontmatter-type-undocumented]: frontmatter の `type: func` を削る（4 スキル共通） -->

# extract-issues — コードから未起票の課題を抽出して起票する

**先に同じディレクトリの [`reference.md`](reference.md) を読む。** 原則・ディレクトリ体系・config と
scope・課題票の書式・タグ文法・モード・設計の根拠はそちらが正本で、ここには書かない。

このスキルの責務は**課題票への起票まで**。ソースへの転記（還流）は `merge-issues` が持つ。
課題票は一時的な作業場であり、正はソース側であることを忘れない。

## 手順

1. **scope 確定** — `reference.md`「config と scope」のとおり config を読む／初回は仮 config で走る。
2. **読解** — scope.code を読み、**起票されていない課題**を拾う。ソース中の TODO grep だけでなく、
   コードとドキュメントの矛盾・怪しい実装・設計の歪みも対象。
3. **重複判定** — `reference.md`「タグの列挙（grep 仕様）」で既存タグを取り、既存の open 節と
   突き合わせる。**既知の課題（open・採用済み・却下・保留）は再起票しない**。
4. **起票** — `reference.md`「課題票の書式」に従って `issue/<layer>.md` へ 1 課題 1 節で書く。
   layer は incompat / bug / refactor / design。
5. **提示** — 起票した課題の一覧をユーザーへ提示し、各課題をどうするか尋ねる（対話で回答して
   もらうか、課題票の「対応方針」欄へ直接追記してもらう）。方針が決まったら `merge-issues` を
   続けて実行することを提案する。

<!-- TODO: [distill:extract-issues-ci-behavior-undefined]: 非対話時は起票済みと記入依頼を出力して終了する -->
<!--   詳細: 手順 5 を非対話でも成立させる。対応方針が未記入の課題は merge-issues では何もせず
       open のまま残す（この挙動自体は既に merge-issues の手順 5 にある）。 -->

## 件数の制御

<!-- TODO: [distill:issue-target-value-duplicated]: 既定値の正本を reference.md へ一本化し、ここからは数値を落とす -->

**課題は open 残を含む上限が全レイヤー合計 20 件**（config の `issue_target` で上書き可）:

- 新規に起票できるのは `issue_target − open 残` 件まで。open が溜まっているほど新規を絞る
  （先に処理を促す）。上限を超えて見つかったら確度・影響の大きい順に打ち切る（残りは次回の抽出で拾う）。
- 見つからなければ**無理に埋めない**（件数合わせの水増し起票をしない。コードが良好なら少なくてよい）。

## 解決済みの課題

根拠（file:line 等）が消えた open 課題は解決候補として提示し、合意の上で節を削除する。

## extract-rules との関係

`extract-rules` が拾う「確度の低い規則（`[distilled:low]`）」は、判断を仰ぐために design 等の
レイヤーへ課題として回ってくることがある。逆に、ここで見つけた歪みが規則の見直しにつながる場合は
`extract-rules` の再実行を促す。読解の対象は同じ scope なので、続けて実行すると効率がよい。