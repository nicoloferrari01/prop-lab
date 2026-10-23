// Every row in every bundled game log needs a date, an opponent, and home/away.
const fs = require("fs");
const path = require("path");

const FILES = [
  "app/data/gamelogs.js",
  "app/data/nba/gamelogs.js",
  "app/data/nba/history.js"
];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function load(rel) {
  const src = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
  const json = src.slice(src.indexOf("=") + 1).replace(/;\s*$/, "");
  return JSON.parse(json);
}

const problems = [];
for (const rel of FILES) {
  const data = load(rel);
  const ix = Object.fromEntries(data.fields.map((f, i) => [f, i]));
  for (const key of ["date", "opp", "ha"]) {
    if (ix[key] == null) problems.push(`${rel}: missing field ${key}`);
  }
  if (ix.date == null) continue;
  for (const p of data.players) {
    for (const g of p.g) {
      const date = g[ix.date], opp = g[ix.opp], ha = g[ix.ha];
      const bad = [];
      if (!DATE.test(String(date || ""))) bad.push("date");
      if (opp == null || String(opp).trim() === "") bad.push("opponent");
      if (ha !== "home" && ha !== "away") bad.push("home/away");
      if (bad.length) problems.push(`${rel}: ${p.name} ${p.id} gid ${g[ix.gid]} missing ${bad.join(", ")}`);
      if (problems.length > 20) break;
    }
    if (problems.length > 20) break;
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`game logs ok (${FILES.length} files)`);
