// Aggiornamento all'apertura, per lega: partite concluse dopo l'ultima data del file incluso.
window.Update = (() => {
  const CACHE_MIN = 10, TIMEOUT = 8000, CONC = 6;
  const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined; } catch (e) { return undefined; } })();
  const etDate = iso => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(iso));
  let shown = null;
  function clockAt(d) {
    const when = d instanceof Date ? d : new Date(d);
    const tz = TZ ? { timeZone: TZ } : {};
    const time = when.toLocaleTimeString(I18n.locale, Object.assign({ hour: "2-digit", minute: "2-digit" }, tz));
    let z = "";
    try {
      const parts = new Intl.DateTimeFormat(I18n.locale, Object.assign({ timeZoneName: "short" }, tz)).formatToParts(when);
      z = (parts.find(p => p.type === "timeZoneName") || {}).value || "";
    } catch (e) {}
    return z ? `${time} ${z}` : time;
  }
  function statusMessage() {
    if (!shown) return "";
    const time = clockAt(shown.when || Date.now());
    if (shown.kind === "cache-offline") return I18n.t("offline_cached", { time });
    if (shown.kind === "bundled") return I18n.t("offline_bundled", { date: I18n.fmtDate(shown.date, true) });
    const n = shown.games || 0;
    if (n === 1) return I18n.t("updated_one", { time });
    if (n > 1) return I18n.t("updated_many", { time, n });
    return I18n.t("updated_none", { time });
  }
  async function getJSON(url) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), TIMEOUT);
    try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
    finally { clearTimeout(t); }
  }
  function months(fromISO, to) {
    const out = []; let y = +fromISO.slice(0, 4), m = +fromISO.slice(5, 7);
    const ty = to.getFullYear(), tm = to.getMonth() + 1;
    while (y < ty || (y === ty && m <= tm)) { out.push(`${y}${String(m).padStart(2, "0")}`); if (++m > 12) { m = 1; y++; } }
    return out;
  }
  const ALIAS = { GSW: "GS", NYK: "NY", SAS: "SA", NOP: "NO", UTA: "UTAH", WAS: "WSH", BRK: "BKN", CHO: "CHA", PHO: "PHX" };
  const NBA_TEAMS = new Set(["ATL","BKN","BOS","CHA","CHI","CLE","DAL","DEN","DET","GS","HOU","IND","LAC","LAL","MEM","MIA","MIL","MIN","NO","NY","OKC","ORL","PHI","PHX","POR","SA","SAC","TOR","UTAH","WSH"]);
  const WNBA_TEAMS = new Set(["ATL","CHI","CON","DAL","GS","IND","LA","LV","MIN","NY","PHX","POR","SEA","TOR","WSH"]);
  const teamOf = (s, nba) => { const u = String(s || ""); if (!nba) return u; return ALIAS[u.toUpperCase()] || u.toUpperCase(); };
  function allStar(e) {
    const c = (e.competitions || [])[0] || {}, t = c.type || {};
    if (String(t.abbreviation || "").toUpperCase() === "ALLSTAR" || String(t.id || "") === "4") return true;
    const blob = [e.name, e.shortName].concat((c.notes || []).map(n => n && n.headline)).join(" ");
    return /all[-\s]?star/i.test(blob);
  }
  function franchise(e, nba) {
    const set = nba ? NBA_TEAMS : WNBA_TEAMS;
    const comps = ((e.competitions || [])[0] || {}).competitors || [];
    if (comps.length < 2) return true;
    return comps.every(x => set.has(teamOf(x.team && x.team.abbreviation, nba)));
  }
  function specialLabel(e, nba) {
    if (allStar(e)) return "All-Star";
    const c = (e.competitions || [])[0] || {};
    const blob = [e.name, e.shortName].concat((c.notes || []).map(n => n && n.headline)).join(" ");
    if (/rising\s*stars?/i.test(blob)) return "Rising Stars";
    if (/skills?/i.test(blob)) return "Skills";
    if (e.season && e.season.type === 1) return "Preseason";
    if (!franchise(e, nba)) return "Speciale";
    return "";
  }
  const mins = v => { const s = String(v ?? ""); if (s.includes(":")) { const [m, sec] = s.split(":"); return Math.round(((+m || 0) + (+sec || 0) / 60) * 10) / 10; } return +s || 0; };
  function parseSummary(j, ev, F, nba) {
    const spec = specialLabel(ev, nba);
    const comp = j.header.competitions[0], date = etDate(ev.date);
    const st = spec ? 9 : (ev.season.type === 5 ? 3 : ev.season.type), rows = [];
    for (const tb of (j.boxscore && j.boxscore.players) || []) {
      const me = comp.competitors.find(c => c.team.id === tb.team.id), opp = comp.competitors.find(c => c !== me);
      const s = tb.statistics[0]; if (!s) continue; const k = s.keys;
      for (const a of s.athletes) {
        if (a.didNotPlay || !a.stats || !a.stats.length) continue;
        const v = Object.fromEntries(k.map((key, i) => [key, a.stats[i]])), n = key => +v[key] || 0;
        const fg = (v["fieldGoalsMade-fieldGoalsAttempted"] || "0-0").split("-").map(Number);
        const f3 = (v["threePointFieldGoalsMade-threePointFieldGoalsAttempted"] || "0-0").split("-").map(Number);
        const oppAbbr = teamOf(opp.team.abbreviation, nba), teamAbbr = teamOf(tb.team.abbreviation, nba);
        const set = nba ? NBA_TEAMS : WNBA_TEAMS;
        if (!spec && (!set.has(oppAbbr) || !set.has(teamAbbr))) continue;
        const g = { date, gid: String(ev.id), st, opp: oppAbbr, ha: me.homeAway, w: !!me.winner, ts: +me.score, os: +opp.score, sp: spec || "",
          min: mins(v.minutes), pts: n("points"), reb: n("rebounds"), ast: n("assists"), fg3: f3[0], fg3a: f3[1], stl: n("steals"),
          blk: n("blocks"), tov: n("turnovers"), fgm: fg[0], fga: fg[1] };
        rows.push({ pid: a.athlete.id, name: a.athlete.displayName, pos: (a.athlete.position || {}).abbreviation || "", team: teamAbbr, g: F.map(f => g[f]) });
      }
    }
    return rows;
  }
  function merge(upd, bundled) {
    const D = JSON.parse(JSON.stringify(bundled)), F = D.fields, byId = new Map(D.players.map(p => [String(p.id), p]));
    for (const r of upd.rows) {
      const row = r.g.slice();
      while (row.length < F.length) row.push(null);
      let p = byId.get(String(r.pid));
      if (!p) { p = { id: String(r.pid), name: r.name, pos: r.pos, team: r.team, g: [] }; byId.set(String(r.pid), p); D.players.push(p); }
      if (!p.g.some(g => String(g[1]) === String(row[1]))) p.g.push(row);
    }
    const stI = F.indexOf("st");
    D.players.forEach(p => { p.g.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0); const lg = p.g[p.g.length - 1]; const hit = upd.rows.find(x => String(x.pid) === String(p.id) && String(x.g[1]) === String(lg[1])); if (hit && hit.g[stI] !== 9) p.team = hit.team; });
    const gids = new Set(), dates = []; D.players.forEach(p => p.g.forEach(g => { gids.add(String(g[1])); dates.push(g[0]); }));
    D.games = gids.size; D.last = dates.sort().pop(); D.espn_live = upd.games;
    return D;
  }
  let token = 0;
  async function start(cfg) {
    const my = ++token;
    const bundled = window.App.data();
    const F = bundled.fields;
    const BASE = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espn}`;
    const CACHE_KEY = `prop-lab-update-${cfg.id}-v1`;
    const baseId = bundled.last + "|" + bundled.games + "|" + bundled.season;
    async function fetchNew() {
      const have = new Set(); bundled.players.forEach(p => p.g.forEach(g => have.add(String(g[1]))));
      const events = [], seen = new Set();
      for (const mo of months(bundled.last, new Date())) {
        const sb = await getJSON(`${BASE}/scoreboard?dates=${mo}&limit=500`);
        for (const e of sb.events || []) {
          if (seen.has(e.id)) continue; seen.add(e.id);
          if (e.status.type.name !== "STATUS_FINAL" || have.has(String(e.id))) continue;
          if (!e.season || e.season.year !== bundled.season) continue;
          const spec = specialLabel(e, cfg.id === "nba");
          if (!spec && ![2, 3, 5].includes(e.season.type)) continue;
          e._sp = spec;
          events.push(e);
        }
      }
      const rows = []; let i = 0;
      await Promise.all(Array.from({ length: Math.min(CONC, events.length) }, async () => {
        while (i < events.length) { const e = events[i++]; rows.push(...parseSummary(await getJSON(`${BASE}/summary?event=${e.id}`), e, F, cfg.id === "nba")); }
      }));
      return { ts: Date.now(), base: baseId, games: events.length, rows };
    }
    function apply(upd, kind, tone, extra) {
      if (my !== token) return;
      shown = Object.assign({ kind, tone }, extra);
      if (upd && upd.games) window.App.setData(merge(upd, window.App.data()));
      window.App.setStatus(statusMessage(), tone);
    }
    let cache = null; try { cache = JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) {}
    if (cache && cache.base !== baseId) cache = null;
    const fresh = cache && Date.now() - cache.ts < CACHE_MIN * 60000;
    if (fresh) { apply(cache, "live", cache.games ? "ok" : "idle", { when: cache.ts, games: cache.games }); return; }
    async function viaServer() {
      if (location.protocol === "file:") throw new Error("nessun server locale");
      const u = await getJSON(`api/update?league=${cfg.id}&since=${bundled.last}&season=${bundled.season}`);
      if (u.error) throw new Error(u.error);
      return { ...u, base: baseId };
    }
    try {
      let upd;
      try { upd = await fetchNew(); } catch (e) { console.warn("ESPN diretto non riuscito, provo server locale:", e); upd = await viaServer(); }
      if (my !== token) return;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(upd)); } catch (e) {}
      apply(upd, "live", upd.games ? "ok" : "idle", { when: upd.ts, games: upd.games });
    } catch (err) {
      if (my !== token) return;
      console.warn("Aggiornamento non riuscito:", err);
      if (cache) apply(cache, "cache-offline", "warn", { when: cache.ts, games: cache.games });
      else apply(null, "bundled", "warn", { date: bundled.last });
    }
  }
  if (window.I18n) I18n.on(() => { if (shown && window.App) App.setStatus(statusMessage(), shown.tone); });
  return { start };
})();
