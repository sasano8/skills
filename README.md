# sasano8-skills

Claude Code / Codex で共用する Agent Skills。
ガイドラインからのスキル生成、コードからの規則抽出、品質監査などを扱う。

## 収録プラグイン

[プラグイン一覧](docs/PLUGINS.md)

## インストール

**Claude Code** — セッション内で実行する:

```text
/plugin marketplace add sasano8/skills
/plugin install auto-skill@sasano8-skills
```

**Codex** — `skill-installer` が利用できる環境で依頼する:

```text
$skill-installer https://github.com/sasano8/skills/tree/main/plugins/auto-skill/skills/auto-skill からスキルをインストールして
```

導入後の呼び出しは Claude Code なら `/auto-skill:auto-skill`、Codex なら `$auto-skill`。
他のスキルは [一覧](docs/PLUGINS.md) から選ぶ。
更新・開発用リンク・アンインストールは [導入・配布ガイド](docs/INSTALLATION.md) を参照。

## 開発

編集規約は [AGENTS.md](AGENTS.md)、構成と作業手順は [開発ガイド](docs/DEVELOPMENT.md) を参照。
基本の確認はリポジトリルートで行う:

```sh
make sync-references
make validate
```

## ライセンス

MIT
