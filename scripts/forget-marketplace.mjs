// settings.json から指定 marketplace 由来のエントリを消す。
//
// `claude plugin install` は ~/.claude/settings.json に extraKnownMarketplaces と
// enabledPlugins を書く。通常は uninstall / marketplace remove が消してくれるが、
// known_marketplaces.json から先に消えていると marketplace remove が "not found" で
// 失敗し、settings.json の取り残しだけが残る。その状態は CLI では回収できないので
// （remove が常に not found になる）、ここで直接消す。
//
// 触るのは extraKnownMarketplaces[<marketplace>] と enabledPlugins["*@<marketplace>"] だけ。
// 消すものが無ければファイルを開くだけで書き込まない。

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const marketplace = process.argv[2];
if (!marketplace) {
  console.error("usage: forget-marketplace.mjs <marketplace>");
  process.exit(2);
}

const files = [
  join(homedir(), ".claude", "settings.json"), // user スコープ
  join(process.cwd(), ".claude", "settings.json"), // project スコープ
  join(process.cwd(), ".claude", "settings.local.json"), // local スコープ
];

for (const file of files) {
  if (!existsSync(file)) continue;

  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    console.error(`skip  ${file}（JSON として読めない）`);
    continue;
  }

  const removed = [];

  const marketplaces = data.extraKnownMarketplaces;
  if (marketplaces && Object.hasOwn(marketplaces, marketplace)) {
    delete marketplaces[marketplace];
    removed.push(`extraKnownMarketplaces.${marketplace}`);
  }

  const plugins = data.enabledPlugins;
  if (plugins) {
    for (const key of Object.keys(plugins)) {
      if (key.endsWith(`@${marketplace}`)) {
        delete plugins[key];
        removed.push(`enabledPlugins.${key}`);
      }
    }
  }

  // 空になった親キー（extraKnownMarketplaces: {} 等）は畳まない。無害なうえ、
  // 畳むと「このリポジトリのエントリが元々無い settings.json」まで書き換えることになる。
  if (removed.length === 0) continue;
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`clean ${file}  (${removed.join(", ")})`);
}
