// Infortuni correnti, per lega: lista ESPN (CORS aperto), cache 10 minuti, poi /api/injuries, poi lo snapshot.
window.Injuries = (() => {
  const CACHE_MIN = 10, TIMEOUT = 8000;
  const PART_KEY = {
    "knee": "part_knee", "leg": "part_leg", "lower leg": "part_lower_leg", "upper leg": "part_upper_leg",
    "foot": "part_foot", "ankle": "part_ankle", "shoulder": "part_shoulder", "hip": "part_hip", "back": "part_back",
    "hand": "part_hand", "wrist": "part_wrist", "elbow": "part_elbow", "arm": "part_arm", "finger": "part_finger",
    "thumb": "part_thumb", "head": "part_head", "neck": "part_neck", "concussion": "part_concussion",
    "illness": "part_illness", "personal": "part_personal", "rest": "part_rest", "coach's decision": "part_coach",
    "achilles": "part_achilles", "hamstring": "part_hamstring", "groin": "part_groin", "calf": "part_calf",
    "quad": "part_quad", "quadricep": "part_quad", "quadriceps": "part_quad", "abdomen": "part_abdomen", "rib": "part_rib",
    "ribs": "part_ribs", "eye": "part_eye", "nose": "part_nose", "heel": "part_heel", "oblique": "part_oblique",
    "adductor": "part_adductor", "toe": "part_toe"
  };
  const DOUBT = ["day-to-day", "day to day", "questionable", "doubtful", "probable", "game-time decision", "game time decision", "gtd"];
  function statusKey(status) {
    return String(status || "").toLowerCase().replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function lineFor(status, part, feminine) {
    const key = statusKey(status);
    let st = "";
    if (key === "out" || key === "out for season" || key === "out for the season" || key === "injured reserve") st = I18n.t("inj_out");
    else if (DOUBT.includes(key)) st = I18n.t("inj_doubt");
    else if (key === "suspension" || key === "suspended") st = I18n.tf("inj_susp", !!feminine);
    else st = (status || "").trim();
    if (!st) return "";
    const pk = String(part || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!pk || pk === "not injury related" || pk === "undisclosed") return st;
    const label = PART_KEY[pk] ? I18n.t(PART_KEY[pk]) : String(part).trim().toLowerCase();
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
  let current = null;
  function apply(players, feminine) {
    current = { players: players || [], feminine: !!feminine };
    if (!window.App || !App.setInjuries) return;
    const list = [];
    for (const p of current.players) {
      const line = lineFor(p.status, p.part, current.feminine);
      const mark = markFor(p.status) || "🚑";
      if (!line || (!p.id && !p.name)) continue;
      list.push({ id: p.id || "", name: p.name || "", line, mark });
    }
    App.setInjuries(list);
  }
  function reapply() { if (current) apply(current.players, current.feminine); }
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
    const feminine = cfg.fem != null ? !!cfg.fem : cfg.id === "wnba";
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
  if (window.I18n) I18n.on(reapply);
  return { start, lineFor, markFor };
})();
