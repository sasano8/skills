# TODO

コメント構文を持たないファイル（JSON 等）に埋められないタグの置き場。
`grep-issues` はこのファイルも走査対象に含める。

TODO: [distill:plugin-description-duplicated]: description を plugin.json に一本化する（対象: .claude-plugin/marketplace.json）
  詳細: marketplace エントリと plugin.json の description が完全一致している。`strict: true`（既定）では
  plugin.json が権威なので marketplace 側は不要。カタログ用に短い要約を出したいのでなければ削る。