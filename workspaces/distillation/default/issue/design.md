# design

## validate-misses-unregistered-plugin — plugins/ に足して marketplace.json への登録を忘れても検証が通る

- meta: origin: llm / status: open / 起票: 2026-08-09
- 内容: `make validate` は「marketplace マニフェストの構文」と「各プラグインのマニフェスト」を
  別々に検査するだけで、**両者の突き合わせをしない**。`plugins/<new>/` を作って
  `.claude-plugin/marketplace.json` の `plugins` 配列に足し忘れても validate は通り、
  CI も緑になる。利用者側では新プラグインが一切見えないまま気づけない。
  README の「プラグインを 1 つ追加する」手順 3 が抜けても検出できない、ということ。
- 根拠: Makefile:18-20（`claude plugin validate .` と `./plugins/$$p` を独立に実行）、
  README.md:109-117（追加手順の 3 が marketplace.json への登録）
- 提案（任意）: `validate` に「`plugins/` のディレクトリ集合 == marketplace.json の
  `source` 集合」を突き合わせる 1 ステップを足す。逆向き（登録済みだが実体が無い）も同時に検出できる。
- 対応方針（ユーザー記入欄）:

## skill-frontmatter-type-undocumented — SKILL.md の `type: func` の意味がどこにも書かれていない

- meta: origin: llm / status: open / 起票: 2026-08-09
- 内容: 4 つの SKILL.md すべてに `type: func` があるが、Claude Code / Codex どちらの仕様にも
  無いキーで、このリポジトリのどこにも説明が無い。他プロジェクトの慣習（dotfiles の
  `func-*` / `unit-*` / `role-*` 命名）に由来すると推測されるが、根拠が repo 内に無い。
  スキルを増やす人が付けるべきか判断できず、外部の利用者には意味不明のノイズになる。
- 根拠: plugins/distillation/skills/{extract-rules,extract-issues,merge-issues,grep-issues}/SKILL.md:3、
  README.md:111-113（追加手順は `name` と `description` にしか触れていない）
- 提案（任意）: README の「プラグインを 1 つ追加する」に 1 行で由来と扱いを書く。
  あるいはリポジトリ固有の意味を持たないなら 4 ファイルから削る。
- 対応方針（ユーザー記入欄）:

## extract-issues-ci-behavior-undefined — CI では成立しない「ユーザーへ尋ねる」手順が無条件

- meta: origin: llm / status: open / 起票: 2026-08-09
- 内容: `extract-issues` の手順 5 は「起票した課題の一覧をユーザーへ提示し、各課題をどうするか
  尋ねる」と無条件に書いてある。一方 README は `extract-issues` を CI で回す想定
  （起票まで）で書かれている。人間のいない CI で「尋ねる」に入ったときどう振る舞うのが正なのかが
  未定義で、実装（＝プロンプト）依存になる。
- 根拠: plugins/distillation/skills/extract-issues/SKILL.md:23-25（手順 5）、
  plugins/distillation/README.md:37-39（CI で回すのは extract-* と grep-issues に限る）、
  README.md:200-209（CI サンプルが extract-issues を非対話で実行）
- 提案（任意）: 手順 5 に「非対話実行時は提示のみで終える（起票済みであることを出力して終了）」を
  明記する。または reference.md の「モード」に非対話を足す。
- 対応方針（ユーザー記入欄）:

## ci-cli-version-unpinned — 検証 CLI が @latest のままで判断が保留されている

- meta: origin: llm / status: open / 起票: 2026-08-09
- 内容: CI は `npm install -g @anthropic-ai/claude-code@latest` で入れるので、CLI 側の検査項目が
  増えると**このリポジトリを触っていないのに CI が落ちる**。README にはその可能性と回避策
  （固定する）が書いてあるだけで、どちらを採るかの判断が保留されている。判断がソースに
  残っていないので、実際に落ちたときに毎回同じ検討をやり直すことになる。
- 根拠: .github/workflows/validate.yml:16、README.md:152-153（「避けたければ workflow で固定する」）
- 提案（任意）: 固定するなら version を書いて Renovate/Dependabot に上げさせる。固定しないなら
  「新しい検査項目を早く拾うために意図的に latest」と REJECT タグで判断を残す。
- 対応方針（ユーザー記入欄）: