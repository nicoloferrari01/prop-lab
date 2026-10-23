// Infortuni correnti, per lega: lista ESPN (CORS aperto), cache 10 minuti, poi /api/injuries, poi lo snapshot.
window.Injuries = (() => {
  const CACHE_MIN = 10, TIMEOUT = 8000;
  const PART = {
    "knee": "ginocchio", "leg": "gamba", "lower leg": "gamba", "upper leg": "coscia",
    "foot": "piede", "ankle": "caviglia", "shoulder": "spalla", "hip": "anca", "back": "schiena",
    "hand": "mano", "wrist": "polso", "elbow": "gomito", "arm": "braccio", "finger": "dito",
    "thumb": "pollice", "head": "testa", "neck": "collo", "concussion": "commozione",
    "illness": "malattia", "personal": "personale", "rest": "riposo", "coach's decision": "scelta tecnica",
    "achilles": "achilleo", "hamstring": "flessori", "groin": "inguine", "calf": "polpaccio",
    "quad": "quadricipite", "quadricep": "quadricipite", "abdomen": "addome", "rib": "costola",
    "ribs": "costole", "eye": "occhio", "nose": "naso", "heel": "tallone", "oblique": "obliquo",
    "adductor": "adduttore", "toe": "dito"
  };
  function statusKey(status) {
    return String(status || "").toLowerCase().replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function lineFor(status, part, feminine) {
    const key = statusKey(status);
    const susp = feminine ? "Squalificata" : "Squalificato";
    const STATUS = {
      "out": "Out", "out for season": "Out", "out for the season": "Out", "injured reserve": "Out",
      "day-to-day": "In dubbio", "day to day": "In dubbio", "questionable": "In dubbio",
      "doubtful": "In dubbio", "probable": "In dubbio", "game-time decision": "In dubbio",
      "game time decision": "In dubbio", "gtd": "In dubbio",
      "suspension": susp, "suspended": susp
    };
    const st = STATUS[key] || (status || "").trim();
    if (!st) return "";
    const pk = String(part || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!pk || pk === "not injury related" || pk === "undisclosed") return st;
    const label = PART[pk] || String(part).trim().toLowerCase();
    return label ? `${st} · ${label}` : st;
  }
  function markFor(status) {
    const key = statusKey(status);
    if (!key) return "";
    if (key === "out" || key.startsWith("out ") || key.startsWith("out-") || key === "suspended" || key === "suspension" || key === "injured reserve" || key === "ir") return "🚑";
    return "🤔";
  }
  function athleteId(a) {
    const hrefs = [];
    if (a.headshot && a.headshot.href) hrefs.push(a.headshot.href);
    for (const l of a.links || []) if (l && l.href) hrefs.push(l.href);
    for (const h of hrefs) {
      const m = /\/players\/full\/(\d+)/.exec(h) || /\/id\/(\d+)/.exec(h);
      if (m) return m[1];
    }
    return "";
  }
  function rowsFrom(payload) {
    if (!payload || typeof payload !== "object") throw new Error("vuoto");
    if (payload.error) throw new Error(payload.error);
    if (Array.isArray(payload.players)) return payload.players.filter(p => p && (p.id || p.name));
    if (!Array.isArray(payload.injuries)) throw new Error("formato");
    const rows = [];
    for (const team of payload.injuries) {
      const list = team && Array.isArray(team.injuries) ? team.injuries : [];
      for (const inj of list) {
        const a = inj && inj.athlete;
        if (!a) continue;
        rows.push({ id: athleteId(a), name: a.displayName || "", status: inj.status || "", part: (inj.details || {}).type || "" });
      }
    }
    return rows;
  }
  function apply(players, feminine) {
    if (!window.App || !App.setInjuries) return;
    const list = [];
    for (const p of players || []) {
      const line = p.line || lineFor(p.status, p.part, feminine);
      const mark = markFor(p.status) || (String(line).startsWith("In dubbio") ? "🤔" : "🚑");
      if (!line || (!p.id && !p.name)) continue;
      list.push({ id: p.id || "", name: p.name || "", line, mark });
    }
    App.setInjuries(list);
  }
  async function getJSON(url) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), TIMEOUT);
    try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
    finally { clearTimeout(t); }
  }
  let token = 0;
  async function start(cfg) {
    const my = ++token;
    const KEY = `prop-lab-injuries-${cfg.id}-v1`;
    const ESPN = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espn}/injuries`;
    const feminine = cfg.id === "wnba";
    let cache = null; try { cache = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (cache && Array.isArray(cache.players) && Date.now() - cache.ts < CACHE_MIN * 60000) {
      if (my === token) apply(cache.players, feminine);
      return;
    }
    const bundled = window[cfg.injGlobal] && Array.isArray(window[cfg.injGlobal].players) ? window[cfg.injGlobal].players : null;
    try {
      let players;
      try { players = rowsFrom(await getJSON(ESPN)); }
      catch (e) {
        console.warn("Infortuni ESPN non disponibili, provo il server locale:", e);
        if (location.protocol === "file:") throw e;
        players = rowsFrom(await getJSON(`api/injuries?league=${cfg.id}`));
      }
      if (my !== token) return;
      try { localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), players })); } catch (e) {}
      apply(players, feminine);
    } catch (err) {
      if (my !== token) return;
      console.warn("Infortuni non disponibili:", err);
      if (cache && Array.isArray(cache.players)) apply(cache.players, feminine);
      else if (bundled) apply(bundled, feminine);
    }
  }
  return { start, lineFor, markFor };
})();
