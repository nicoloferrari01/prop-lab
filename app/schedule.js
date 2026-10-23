// Calendario partite, per lega: scoreboard ESPN, cache 10 minuti, fallback /api/schedule.
window.Schedule = (() => {
  const CACHE_MIN = 10, TIMEOUT = 8000, AHEAD = 8;
  async function getJSON(url) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), TIMEOUT);
    try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
    finally { clearTimeout(t); }
  }
  const ym = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  function norm(e) {
    const c = e.competitions[0], side = h => c.competitors.find(x => x.homeAway === h) || {};
    const team = x => ({ abbr: x.team.abbreviation, name: x.team.displayName, short: x.team.shortDisplayName || x.team.name, logo: x.team.logo || "",
      score: x.score !== undefined && x.score !== "" ? +x.score : null, winner: !!x.winner,
      record: ((x.records || []).find(r => r.type === "total") || {}).summary || "" });
    return { id: String(e.id), date: e.date, state: e.status.type.state, detail: e.status.type.shortDetail || e.status.type.detail || "",
      st: (e.season || {}).type, season: (e.season || {}).year, home: team(side("home")), away: team(side("away")),
      venue: c.venue ? [c.venue.fullName, (c.venue.address || {}).city].filter(Boolean).join(", ") : "",
      series: c.series && c.series.summary ? c.series.summary : "", note: ((c.notes || [])[0] || {}).headline || "",
      tv: ((c.broadcasts || []).flatMap(b => b.names || [])).join(", ") };
  }
  let token = 0;
  async function start(cfg) {
    const my = ++token;
    const BASE = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espn}`;
    const KEY = `prop-lab-schedule-${cfg.id}-v1`;
    async function fetchDirect() {
      const now = new Date(), seen = new Map();
      const add = sb => (sb.events || []).forEach(e => seen.set(String(e.id), norm(e)));
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      add(await getJSON(`${BASE}/scoreboard?dates=${ym(prev)}&limit=500`));
      add(await getJSON(`${BASE}/scoreboard?dates=${ym(now)}&limit=500`));
      for (let k = 1; k <= AHEAD; k++) {
        if ([...seen.values()].some(g => g.state !== "post" && new Date(g.date) > now)) break;
        add(await getJSON(`${BASE}/scoreboard?dates=${ym(new Date(now.getFullYear(), now.getMonth() + k, 1))}&limit=500`));
      }
      return { ts: Date.now(), games: [...seen.values()].sort((a, b) => a.date < b.date ? -1 : 1) };
    }
    let cache = null; try { cache = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (cache && Date.now() - cache.ts < CACHE_MIN * 60000 && Array.isArray(cache.games)) {
      if (my === token) window.App.setSchedule({ ...cache, source: "cache" });
      return;
    }
    try {
      let s;
      try { s = await fetchDirect(); }
      catch (e) {
        console.warn("Calendario ESPN diretto non riuscito, provo server locale:", e);
        if (location.protocol === "file:") throw e;
        s = await getJSON(`api/schedule?league=${cfg.id}`); if (s.error) throw new Error(s.error);
      }
      if (my !== token) return;
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
      window.App.setSchedule({ ...s, source: "live" });
    } catch (err) {
      if (my !== token) return;
      console.warn("Calendario non disponibile:", err);
      window.App.setSchedule(cache && Array.isArray(cache.games) ? { ...cache, source: "stale" } : { ts: null, games: [], source: "offline" });
    }
  }
  return { start };
})();
