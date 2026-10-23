// Scelta del campionato: URL, scelta salvata, poi NBA se la sua stagione è in corso.
window.LEAGUES = {
  wnba: {
    id: "wnba", label: "WNBA", espn: "basketball/wnba", shot: "wnba",
    dataGlobal: "WNBA_DATA", injGlobal: "WNBA_INJURIES",
    fem: true,
    stars: ["A'ja Wilson"]
  },
  nba: {
    id: "nba", label: "NBA", espn: "basketball/nba", shot: "nba",
    dataGlobal: "NBA_DATA", injGlobal: "NBA_INJURIES",
    fem: false,
    stars: ["Jokić", "Gilgeous-Alexander"]
  }
};
const LEAGUE_KEY = "prop-lab-league";

function nbaInSeason(d) {
  const m = d.getMonth() + 1;
  return m >= 10 || m <= 6;
}
function initialLeague() {
  const q = new URLSearchParams(location.search).get("league");
  if (q === "nba" || q === "wnba") return q;
  try {
    const s = localStorage.getItem(LEAGUE_KEY);
    if (s === "nba" || s === "wnba") return s;
  } catch (e) {}
  return nbaInSeason(new Date()) ? "nba" : "wnba";
}
function remember(id) {
  try { localStorage.setItem(LEAGUE_KEY, id); } catch (e) {}
  const u = new URL(location.href);
  u.searchParams.set("league", id);
  if (u.search !== location.search) history.replaceState(history.state, "", u.pathname + u.search + u.hash);
}
function asset(path) {
  const v = document.documentElement.getAttribute("data-v");
  return v ? path + "?v=" + encodeURIComponent(v) : path;
}
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = asset(src);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(src));
    document.head.appendChild(s);
  });
}
function mergeNba(cur, hist) {
  const map = new Map();
  const cleanId = id => { const s = String(id); return s.endsWith(".0") ? s.slice(0, -2) : s; };
  const add = (p, current) => {
    const id = cleanId(p.id);
    let d = map.get(id);
    if (!d) { d = { id, name: p.name, pos: p.pos || "", team: p.team, g: [] }; map.set(id, d); }
    if (current) { d.team = p.team; d.name = p.name; if (p.pos) d.pos = p.pos; }
    const seen = new Set(d.g.map(g => cleanId(g[1])));
    for (const g of p.g) {
      const row = g.slice(); row[1] = cleanId(row[1]);
      if (!seen.has(row[1])) { d.g.push(row); seen.add(row[1]); }
    }
  };
  if (hist && hist.players) for (const p of hist.players) add(p, false);
  for (const p of cur.players) add(p, true);
  const players = [...map.values()];
  for (const p of players) p.g.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : String(a[1]).localeCompare(String(b[1])));
  const gids = new Set();
  players.forEach(p => p.g.forEach(g => gids.add(String(g[1]))));
  players.sort((a, b) => b.g.reduce((s, g) => s + (g[2] === 9 ? 0 : (+g[8] || 0)), 0) - a.g.reduce((s, g) => s + (g[2] === 9 ? 0 : (+g[8] || 0)), 0));
  return Object.assign({}, cur, {
    players, games: gids.size,
    first: hist && hist.first ? hist.first : cur.first,
    label: cur.label || String(cur.season),
    historyLabel: hist && hist.label ? hist.label : null,
    seasonStart: cur.first || null
  });
}
let nbaPromise = null;
function loadLeague(id) {
  if (id === "wnba") return Promise.resolve(window.WNBA_DATA);
  if (!nbaPromise) {
    const t0 = performance.now();
    nbaPromise = (async () => {
      try {
        await loadScript("data/nba/gamelogs.js");
        try { await loadScript("data/nba/history.js"); } catch (e) { console.warn("Storico NBA non disponibile:", e); }
        try { await loadScript("data/nba/injuries.js"); } catch (e) { console.warn("Snapshot infortuni NBA non disponibile:", e); }
        if (!window.NBA_DATA) throw new Error("NBA_DATA mancante");
        window.__nbaLoadMs = Math.round(performance.now() - t0);
      } catch (e) { nbaPromise = null; throw e; }
    })();
  }
  return nbaPromise.then(() => mergeNba(window.NBA_DATA, window.NBA_HISTORY));
}
function bootLive(cfg) {
  if (window.Injuries) Injuries.start(cfg);
  if (window.Update) Update.start(cfg);
  if (window.Schedule) Schedule.start(cfg);
}
let current = null, req = 0;
async function choose(id) {
  if (id !== "nba" && id !== "wnba") return;
  if (current && current !== id) {
    try { localStorage.setItem(LEAGUE_KEY, id); } catch (e) {}
    const u = new URL(location.href);
    u.searchParams.set("league", id);
    u.searchParams.delete("game");
    u.searchParams.delete("player");
    u.hash = "#partite";
    location.replace(u.pathname + u.search + u.hash);
    return;
  }
  remember(id);
  const pop = document.getElementById("league-pop");
  if (pop) pop.hidden = true;
  document.querySelectorAll(".league-btn").forEach(btn => btn.setAttribute("aria-expanded", "false"));
  if (current === id) return;
  current = id;
  const my = ++req;
  const cfg = window.LEAGUES[id];
  document.querySelectorAll(".league-label").forEach(el => { el.textContent = cfg.label; });
  if (id !== "wnba") App.setStatus(I18n.t("loading_league", { league: cfg.label }), "pending");
  try {
    const data = await loadLeague(id);
    if (my !== req) return;
    App.start(data, cfg);
    bootLive(cfg);
  } catch (err) {
    if (my !== req) return;
    console.warn(err);
    App.setStatus(I18n.t("league_unavailable", { league: cfg.label }), "warn");
  }
}

remember(initialLeague());
choose(initialLeague());

const leaguePop = document.getElementById("league-pop");
function setLeagueExpanded(open) {
  leaguePop.hidden = !open;
  document.querySelectorAll(".league-btn").forEach(btn => btn.setAttribute("aria-expanded", open ? "true" : "false"));
}
document.querySelectorAll(".league-btn").forEach(leagueBtn => leagueBtn.addEventListener("click", e => {
  e.stopPropagation();
  const open = leaguePop.hidden;
  setLeagueExpanded(open);
  if (open) document.querySelectorAll(".league-opt").forEach(b => b.classList.toggle("on", b.dataset.league === (App.league ? App.league().id : current)));
}));
leaguePop.addEventListener("click", e => {
  if (e.target === leaguePop) { setLeagueExpanded(false); return; }
  const b = e.target.closest(".league-opt");
  if (b) choose(b.dataset.league);
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !leaguePop.hidden) setLeagueExpanded(false);
});
