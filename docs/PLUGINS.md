# 収録プラグイン

Claude Code / Codex で共用するスキル群。各プラグインの詳細はリンク先の README を参照。

| プラグイン | 内容 | スキル |
| --- | --- | --- |
| [advisor](../plugins/advisor/README.md) | 変化する製品情報を調査し、用途と優先順位に合う選択肢を助言する | [`ai-model`](../plugins/advisor/skills/ai-model/SKILL.md) |
| [auto-skill](../plugins/auto-skill/README.md) | ガイドラインと関連文書から、正本を参照するリポジトリ用スキルを生成・更新する | [`auto-skill`](../plugins/auto-skill/skills/auto-skill/SKILL.md) |
| [distillation](../plugins/distillation/README.md) | コードから規則・慣習を抽出してスキル草稿を生成し、課題の抽出・管理・ソースへの還流を行う | [`extract-issues`](../plugins/distillation/skills/extract-issues/SKILL.md) [`extract-rules`](../plugins/distillation/skills/extract-rules/SKILL.md) [`grep-issues`](../plugins/distillation/skills/grep-issues/SKILL.md) [`merge-issues`](../plugins/distillation/skills/merge-issues/SKILL.md) [`track-issues`](../plugins/distillation/skills/track-issues/SKILL.md) |
| [onboarding](../plugins/onboarding/README.md) | エージェントの導入、開発環境のセットアップ、シークレット混入防止を整える | [`agent-install`](../plugins/onboarding/skills/agent-install/SKILL.md) [`env-bootstrap`](../plugins/onboarding/skills/env-bootstrap/SKILL.md) [`secret-guard`](../plugins/onboarding/skills/secret-guard/SKILL.md) |
| [quality](../plugins/quality/README.md) | プロジェクトの品質を監査し、ドキュメントサイトや PyPI リリースの CI を整える | [`audit`](../plugins/quality/skills/audit/SKILL.md) [`mkdocs`](../plugins/quality/skills/mkdocs/SKILL.md) [`release-pypi`](../plugins/quality/skills/release-pypi/SKILL.md) |

Claude Code では `/<plugin>:<skill>`、Codex では `$<skill>` で呼び出す。
導入方法は [README.md](../README.md#インストール) を参照。
