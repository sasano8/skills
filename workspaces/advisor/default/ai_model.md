---
skill: ai-model
target: default
researched_at: 2026-08-09
scope: [claude-code, codex]
priorities: [推論品質, 応答速度]
---

# ai_model — 調査結果と推奨（2026-08-09 現在）

対象は手元の 2 本。バージョンは実測（`公式確認`）:

- Claude Code CLI `2.1.226`
- Codex CLI `codex-cli 0.147.0`（バイナリ実体 `0.147.0-x86_64-unknown-linux-musl`）

「速度」は以下を別の軸として扱う。表もこの軸で分けている。

1. 生成スループット（トークン/秒） … Claude の fast mode、Codex の速度ティア
2. タスク完了時間 … 思考量＝effort が支配的
3. コスト・利用枠の消費速度

## 調査結果

### Claude Code

**選べるモデルとエイリアス**（`公式確認`: [Model configuration](https://code.claude.com/docs/en/model-config)）

| エイリアス | 解決先（Anthropic API） |
| --- | --- |
| `best` | 組織が使えるなら Fable 5、なければ最新 Opus |
| `fable` | Claude Fable 5 |
| `opus` | Opus 5 |
| `sonnet` | Sonnet 5 |
| `haiku` | Haiku 4.5 |
| `opusplan` | plan モードは opus、実行は sonnet |
| `opus[1m]` / `sonnet[1m]` | 1M コンテキスト版（Sonnet 5 は既に 1M なので `sonnet[1m]` は無効果） |

- **`default` はアカウント種別で変わる** — Max / Team Premium / Enterprise 従量 / Anthropic API は **Opus 5**、Pro / Team Standard / Enterprise シートは **Sonnet 5**（`公式確認`）。
- Opus 5 は **v2.1.219 以降**、Sonnet 5 は v2.1.197 以降が必要。手元の 2.1.226 は両方満たす（`公式確認` + ローカル実測）。
- **Fable 5 はどのアカウント種別でも既定にならない。** `/model fable` 等で明示選択したときだけ使われ、ZDR 環境では選べない（`公式確認`）。

**effort（推論設定）**（`公式確認`: 同上「Adjust effort level」）

| モデル | 選べる effort |
| --- | --- |
| Fable 5 / Opus 5 / Sonnet 5 / Opus 4.8 / Opus 4.7 | `low` `medium` `high` `xhigh` `max` |
| Opus 4.6 / Sonnet 4.6 | `low` `medium` `high` `max` |
| Haiku 4.5 ほか | effort 非対応 |

- **既定は `high`**（Opus 4.7 のみ `xhigh`）。
- `max` は**セッション限定**（環境変数で設定した場合を除く）。`low`〜`xhigh` は永続。
- 非対応レベルを指定すると、それ以下で最大のレベルへ落ちる（例: Opus 4.6 の `xhigh` → `high`）。
- **effort の目盛りはモデルごとに較正されている** — 同じ名前でも実際の計算量は違う（`公式確認`）。
- `ultracode` は effort ではなく Claude Code の設定。`xhigh` を送りつつ dynamic workflow を組ませる。セッション限定。
- `ultrathink` をプロンプトに含めると、その 1 ターンだけ深く考えさせられる（API に送る effort は変わらない）。

**fast mode（effort とは独立の実行モード）**（`公式確認`: [Fast mode](https://code.claude.com/docs/en/fast-mode)）

- **Opus 5 と Opus 4.8 のみ**。Sonnet / Haiku 不可。Opus 4.7 の fast mode は 2026-07-24 に削除済み。
- 同一モデルを **最大 2.5 倍速**で走らせる。品質は変わらない。
- **料金 $10 / $50 per MTok（入力/出力）**、1M コンテキスト全域でフラット。
- サブスク（Pro/Max/Team/Enterprise）では **usage credits 経由のみ**で、プラン内利用枠には含まれない。**usage credits を有効化していないと使えない**。Team/Enterprise は Owner の有効化が必要。
- Bedrock / Google Cloud / Foundry / Claude Platform on AWS では**使えない**。VS Code 拡張でも不可（CLI の `/fast` のみ）。
- **会話の途中でオンにすると、その時点の全コンテキストを fast 料金の未キャッシュ入力として一度支払う。** 使うならセッション開始時に入れるのが安い。
- fast mode の rate limit は通常 Opus とは別枠。上限に当たると自動で標準速度へフォールバックし、クールダウン後に自動復帰。

**その他**

- 1M コンテキストは Max / Team / Enterprise で Opus に自動適用（追加設定なし）。Sonnet 4.6 の 1M は全プランで usage credits が要る（`公式確認`）。
- Fable 5 は安全性分類器に引っかかると自動でモデルフォールバックする（`公式確認`）。

### Codex

**選べるモデル**（`公式確認`: [Models](https://learn.chatgpt.com/docs/models)／ローカルバイナリ実測）

| モデル | スラグ | 位置づけ（公式表現） |
| --- | --- | --- |
| 5.6 Sol | `gpt-5.6-sol` | 「複雑なコーディング・コンピュータ操作・リサーチ・セキュリティに最も強いフラッグシップ」 |
| 5.6 Terra | `gpt-5.6-terra` | 「日常業務向けのバランス型。GPT-5.5 と competitive な性能をより低コストで」 |
| 5.6 Luna | `gpt-5.6-luna` | 「最低コストで強い能力を出す高速・安価モデル」 |
| 5.3 Codex Spark | `gpt-5.3-codex-spark` | ほぼ即応のリアルタイム反復向け。テキストのみ、**research preview / ChatGPT Pro 限定** |
| 5.5 / 5.4 / 5.4 Mini | `gpt-5.5` ほか | 旧世代。**5.4 と 5.4 Mini は 2026-08-31 に Codex から引退**（ChatGPT サインイン利用者） |

- ローカルバイナリには `gpt-5.6-pro` も含まれる（ローカル実測）。公式 models ページの一覧には出ていないため、利用可否はアカウント依存と見る（`推定`）。
- 既定モデルは固定文言では書かれておらず「指定しなければ推奨モデルを使う」。CLI の表示例は `gpt-5.6-sol medium`（`公式確認`）。

**reasoning effort**

- ローカル実測（0.147.0 のバイナリが送出する値）: `none` `low` `medium` `high` `xhigh` `max` `ultra`。既定は `medium`。
- 公式 models ページの表記は Low / Medium / High / Extra High / Max / Ultra（`公式確認`）。一方 [Configuration Reference](https://learn.chatgpt.com/docs/config-file/config-reference) の `model_reasoning_effort` は `minimal | low | medium | high | xhigh` としか書いておらず、**`max` / `ultra` が抜けている**。CLI が実際に送る値が新しいので、ローカル実測を優先する（`推定`: config リファレンスの記述が追いついていない）。
- **どのレベルが使えるかはモデルごとにサーバから配られる**（バイナリ内に `supported_reasoning_levels` / `default_reasoning_levels` というモデルメタデータがある。ローカル実測）。つまり全モデル × 全 effort が有効とは限らない。
- **Ultra は effort であると同時に並列サブエージェント機構**。「最大の推論を使い、適した作業をサブエージェントへ委譲する」。Codex では **Plus 以上**（`公式確認`）。CLI 内に「Ultra reasoning may proactively use multiple agents」「reasoning effort can quickly consume Plus plan rate limits」という警告文字列が実在する（ローカル実測）。
- Codex にも **Fast mode トグルがある**（CLI のショートカット定義に "Turn Fast mode on or off"。ローカル実測）。対応モデルでは credits の消費レートが上がる（`公式確認`: [Pricing](https://learn.chatgpt.com/docs/pricing)）。詳細な対応表は未確認。

**コスト・利用枠**（`公式確認`: Pricing）

| モデル | クレジット（入力 / 出力、per 1M tokens） |
| --- | --- |
| GPT-5.6 Sol | 125 / 750 |
| GPT-5.6 Terra | 50 / 300 |
| GPT-5.6 Luna | 5 / 30 |

- GPT-5.6 の平均消費は 1 メッセージあたり 5〜40 credits。
- Plus は 5 時間あたり 10〜2,000 メッセージ（Sol〜Luna でレンジが違う）。Pro 5x はその 5 倍、Pro 20x は 20 倍。Business は Plus 相当。
- **ChatGPT Work と Codex は利用枠を共有する。**

### 公式に確認できなかったこと

- Codex の各モデルが実際に受け付ける effort の組み合わせ（サーバ配布のため、公開表が無い）。
- Codex Fast mode の対応モデルと倍率。
- Claude / Codex とも、**公式が数値化したレイテンシは無い**。下表の応答速度は公式の定性的説明＋設定の性質からの `推定`。

## 用途マトリクス

評価軸は `最速 / 速い / 中間 / 遅い / 最も遅い`、`定型 / 標準 / 高度 / 最難関`。

### Claude Code（fast mode は Opus 5 / Opus 4.8 のみ。標準/高速を別行にした）

| モデル | 速度・推論設定 | 応答速度 | 推論品質 | コスト・利用枠 | 向く用途 | 避ける用途 |
| --- | --- | --- | --- | --- | --- | --- |
| Haiku 4.5 | effort 非対応（固定） | 最速 | 定型 | 最小。プラン枠内 | 単純な整形・分類・雑タスク | 設計判断、複数ファイル改修 |
| Sonnet 5 | `low` | 最速 | 定型 | 小。プラン枠内 | 短い定型編集、レイテンシ最優先 | 多段推論を要する作業 |
| Sonnet 5 | `medium` | 速い | 標準 | 小〜中。プラン枠内 | 日常のコーディング、対話的な往復 | 大規模設計、長時間自律 |
| Sonnet 5 | `high`（既定） | 中間 | 標準〜高度 | 中。プラン枠内 | Pro プランの主力。実装・レビュー全般 | 最難関の設計・原因究明 |
| Sonnet 5 | `xhigh` / `max` | 遅い | 高度 | 中〜大。`max` はセッション限定 | Sonnet 枠内で品質を絞り出したいとき | 反復の速さが要る対話 |
| Opus 5 | `low` / `medium` | 速い | 標準〜高度 | 中。プラン枠内 | Opus の判断力を保ちつつ速く回す | — |
| Opus 5 | `high`（既定） | 中間 | 高度 | 中〜大。プラン枠内 | **既定の主力**。実装・調査・レビュー | 単純作業（過剰） |
| Opus 5 | `xhigh` | 遅い | 高度〜最難関 | 大 | 難しい設計、込み入ったデバッグ | 対話的な小改修 |
| Opus 5 | `max` | 最も遅い | 最難関 | 最大。セッション限定 | 正しさがコストに優先する難問 | 常用（overthinking しやすいと公式が明記） |
| Opus 5 | `ultracode`（= xhigh + workflow） | 最も遅い | 最難関 | 最大。セッション限定 | 大きめタスクを workflow に分解させる | 小タスク（エージェント大量起動） |
| Opus 5 / Opus 4.8 | **fast mode**（× 任意 effort） | 同 effort 比で最大 2.5 倍速 | 変わらない | **$10/$50 per MTok**。サブスクでは usage credits のみ・プラン枠外。有効化時に会話全体を一度課金 | 生きたデバッグ、締切のある対話作業 | 長時間自律実行、CI/バッチ |
| Fable 5 | `high` / `xhigh` | 最も遅い | 最難関 | 最大 | 一区切りに収まらない長時間自律、原因究明、アーキテクチャ判断 | 短い対話。既定にはならない |

**非対応・条件付き**

- fast mode × Sonnet / Haiku / Fable 5 → 不可。fast 対応外モデルへ切り替えると fast は自動オフ。
- fast mode × Bedrock / Google Cloud / Foundry / Claude Platform on AWS → 不可。VS Code 拡張 → 不可。
- effort × Haiku 4.5 → 非対応。
- `xhigh` × Opus 4.6 / Sonnet 4.6 → `high` に丸められる。
- Fable 5 × ZDR 環境 → 選択不可。Fable 5 は thinking をオフにできない。

### Codex

| モデル | 速度・推論設定 | 応答速度 | 推論品質 | コスト・利用枠 | 向く用途 | 避ける用途 |
| --- | --- | --- | --- | --- | --- | --- |
| 5.3 Codex Spark | （effort 非適用） | 最速 | 定型 | 最小。**Pro 限定・research preview・テキストのみ** | ほぼ即応のリアルタイム反復 | 実運用の重要作業 |
| 5.6 Luna | `low` / `medium` | 最速 | 定型〜標準 | 5 / 30 credits per MTok。最小 | 大量処理、軽い編集、枠を節約したいとき | 難しい設計・調査 |
| 5.6 Terra | `medium`（既定） | 速い | 標準 | 50 / 300。中 | 日常業務の主力。コスト効率重視 | 最難関タスク |
| 5.6 Terra | `high` / `xhigh` | 中間〜遅い | 標準〜高度 | 中〜大 | Terra 枠で品質を上げたいとき | レイテンシ最優先 |
| 5.6 Sol | `low` / `medium`（既定） | 中間 | 高度 | 125 / 750。大 | **既定の主力。**公式いわく「Sol は低い effort でも高性能」 | 軽作業（クレジット効率が悪い） |
| 5.6 Sol | `high` / `xhigh` | 遅い | 高度〜最難関 | 大 | 難しい多段作業、セキュリティ・リサーチ | 対話の反復 |
| 5.6 Sol | `max` | 最も遅い | 最難関 | 最大 | 最難関を品質優先で | 常用 |
| 5.6 Sol | `ultra`（並列サブエージェント） | タスク完了は速くなりうる／消費は最大 | 最難関 | 最大。**Plus 以上**。同時実行が増えると枠を急速に消費（CLI が警告を出す） | 分割可能な大タスク | 分割できない単一タスク、枠が厳しいとき |
| 5.6 Pro | — | 遅い | 最難関（`推定`） | 未確認 | — | 公式 models 一覧に無い。可否はアカウント依存 |
| 5.5 / 5.4 / 5.4 Mini | — | — | — | — | 旧世代。**5.4 系は 2026-08-31 に Codex から引退** | 新規採用 |

**非対応・条件付き**

- `ultra` は「eligible account かつ対応モデル」限定。Codex では Plus 以上。
- 各モデルが受け付ける effort はサーバ配布のメタデータ次第。全直積が有効とは限らない（未確認）。
- `none` effort は CLI が送る値としては存在するが、対応モデルは未確認。

## 推奨構成

優先順位は「推論品質 → 応答速度」で並べた。

### 1. 既定のおすすめ

- **Claude Code: `opus`（Opus 5）+ effort `high`（既定のまま）**
  Anthropic API / Max 相当なら `default` がすでに Opus 5 + high。触らないのが正解。
  *切替条件*: 単純作業が続くなら `/effort medium`。設計判断や原因究明に入ったら `xhigh` へ一段上げる。
- **Codex: `gpt-5.6-sol` + `medium`（既定のまま）**
  公式が「Sol は低い effort でも高性能」と明言している。まず既定で計測してから動かす。
  *切替条件*: クレジット消費が問題になったら **モデルを Terra に下げる方が、Sol の effort を下げるより効く**（Sol と Terra はクレジット単価が 2.5 倍違う）。

### 2. 速度優先

- **Claude Code（対話中の即応が要る）: Opus 5 + `/fast`、必要なら effort を `medium` に下げる**
  fast mode は品質を落とさずスループットだけ上げる唯一の手段。ただし **usage credits 有効化が前提**で、プラン枠には含まれない。**セッション開始時にオンにする**（途中投入は会話全体を一度 fast 料金で課金される）。
  クレジットを使いたくないなら代替は **Sonnet 5 + `medium`**。
  *切替条件*: fast の rate limit に当たったら自動で標準速度に落ちるので、そのまま続行して構わない。長時間自律実行やバッチに入る前に `/fast` を切る。
- **Codex: `gpt-5.6-terra` + `medium`、軽作業は `gpt-5.6-luna` + `low`**
  *切替条件*: Terra で 2 回続けて手戻りが出たら Sol に戻す。

### 3. 品質優先への切り替え先

- **Claude Code: Fable 5 + effort `high`〜`xhigh`（`/model fable`）**
  「一区切りに収まらない仕事」向け。手順ではなく**達成したい結果**を渡す。検証を促すプロンプトは不要（自分で検証する）。
  *切替条件*: 短い対話や小改修に使わない。ZDR 環境では選べない。安全性分類器に当たると自動フォールバックする。
- **Codex: `gpt-5.6-sol` + `xhigh`、分割可能な大タスクなら `ultra`**
  *切替条件*: `ultra` は並列エージェントを起こすので、Plus 枠だと一気に消費する。単一の分割不能タスクなら `xhigh` / `max` に留める。

### 効かせ方の注意

- 小さいモデルに高い effort を積む構成（例: Sonnet 5 + `max`）と、大きいモデルを低い effort で使う構成（例: Opus 5 + `medium`）は**同等ではない**。effort の目盛りはモデルごとに較正されているので、名前だけで比較しない。
- `max` は公式が「overthinking しやすく、逓減しうる。広く採用する前にテストせよ」と明記している。難問限定で使う。
- Claude Code には 1 ターンだけ深く考えさせる `ultrathink` がある。セッション effort を上げずに済む場面はこちらで足りる。

### 僅差は測って決める

公開情報だけでは決められない差（Opus 5 `high` vs `xhigh`、Sol `medium` vs `high`、Terra vs Sol など）は、**代表タスクを同じ入力で 3〜5 回**流し、**完了時間の中央値 / 成功率 / 手戻り回数 / トークン（クレジット）消費**の 4 つで比較する。1 回の体感で決めない。

## 未確認事項

- Codex の各モデルが実際に受け付ける effort の組み合わせ（サーバ配布のため公開表が無い）。
- Codex の Fast mode の対応モデル・倍率・課金レート。
- `gpt-5.6-pro` の Codex CLI での利用可否と位置づけ。
- 利用者のプラン（Claude: Pro/Max/Team/API、ChatGPT: Plus/Pro/Business）。ここが決まると「既定のおすすめ」が変わる — 特に Claude Pro プランでは `default` が Sonnet 5 になり、fast mode には usage credits の有効化が要る。
