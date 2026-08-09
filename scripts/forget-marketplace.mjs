// settings.json から指定 marketplace 由来のエントリを消す。
//
// `claude plugin install` は ~/.claude/settings.json に extraKnownMarketplaces と
// enabledPlugins を書く。通常は uninstall / marketplace remove が消してくれるが、
// known_marketplaces.json から先に消えていると marketplace remove が "not found" で
// 失敗し、settings.json の取り残しだけが残る。その状態は CLI では回収できないので
// （remove が常に not found になる）、ここで直接消す。
//
// 触るのは extraKnownMarketplaces[<marketplace>] と enabledPlugins["*@<marketplace>"] だけ。
// 空になった親キーは削除する。他の設定には触れない。

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

  // 空になった親キーは畳む。CLI 自身が中身を消したあとに {} だけ残ることがあるので、
  // ここに来た時点で空なら（自分が消したかに関わらず）落とす。
  const emptied = [];
  for (const key of ["extraKnownMarketplaces", "enabledPlugins"]) {
    if (data[key] && Object.keys(data[key]).length === 0) {
      delete data[key];
      emptied.push(key);
    }
  }

  if (removed.length === 0 && emptied.length === 0) continue;
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  const what = [...removed, ...emptied.map((k) => `${k}（空なので削除）`)];
  console.log(`clean ${file}  (${what.join(", ")})`);
}
