window.App = (() => {
let D = window.WNBA_DATA;
const ix = Object.fromEntries(D.fields.map((f, i) => [f, i]));
function reindex(fields) { for (const k of Object.keys(ix)) delete ix[k]; fields.forEach((f, i) => { ix[f] = i; }); }
let L = { id: "wnba", label: "WNBA", shot: "wnba", noun: "giocatrici", one: "Giocatrice", none: "Nessuna giocatrice nei dati con questi filtri", ph: "Cerca giocatrice o squadra…", line: "Linea per giocatrice (mediana)", pause: "La WNBA è in pausa: la nuova stagione di solito parte a maggio. Intanto ecco gli ultimi risultati.", stars: ["A'ja Wilson"] };
const fold = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function pickStar() {
  for (const n of L.stars || []) { const f = fold(n); const p = D.players.find(x => fold(x.name).includes(f)); if (p) return p; }
  return D.players[0];
}
function freshText() {
  const lab = D.label || D.season;
  const hist = D.historyLabel ? ` · storico ${D.historyLabel}` : "";
  return `Dati ${lab} fino al ${fmtD(D.last)}/${String(D.last).slice(0, 4)} · ${D.games} partite${hist}`;
}
const STATS = [
  ["pts","Punti",g=>g[ix.pts]],["reb","Rimbalzi",g=>g[ix.reb]],["ast","Assist",g=>g[ix.ast]],
  ["fg3","Triple segnate",g=>g[ix.fg3]],["pra","P+R+A",g=>g[ix.pts]+g[ix.reb]+g[ix.ast]],
  ["pr","P+R",g=>g[ix.pts]+g[ix.reb]],["pa","P+A",g=>g[ix.pts]+g[ix.ast]],["ra","R+A",g=>g[ix.reb]+g[ix.ast]],
  ["stl","Recuperi",g=>g[ix.stl]],["blk","Stoppate",g=>g[ix.blk]],["sb","Rec+Stop",g=>g[ix.stl]+g[ix.blk]],
  ["tov","Palle perse",g=>g[ix.tov]],["min","Minuti",g=>g[ix.min]]];
const PERIODS = [["5","Ultime 5"],["10","Ultime 10"],["20","Ultime 20"],["all","Stagione"]];
const VENUE = [["all","Casa + Trasferta"],["home","Casa"],["away","Trasferta"]];
const PHASE = [["all","RS + Playoff"],["2","Regular season"],["3","Playoff"]];
const S = { p: D.players[0], stat: "pts", line: null, period: "10", opp: "all", venue: "all", phase: "all" };
const $ = id => document.getElementById(id);
const fmtD = d => { const [y,m,dd] = d.split("-"); return `${dd}/${m}`; };
const median = a => { const s=[...a].sort((x,y)=>x-y), n=s.length; return n? (n%2? s[(n-1)/2] : (s[n/2-1]+s[n/2])/2):0; };
const statFn = () => STATS.find(s => s[0] === S.stat)[2];
const statName = () => STATS.find(s => s[0] === S.stat)[1];
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let INJ_BY_ID = new Map(), INJ_BY_NAME = new Map(), injPopBtn = null;
function injuryOf(p) {
  if (!p) return null;
  return INJ_BY_ID.get(String(p.id)) || INJ_BY_NAME.get(String(p.name || "").toLowerCase()) || null;
}
function injGlyph(x) {
  if (x && (x.mark === "🤔" || x.mark === "🚑")) return x.mark;
  return String(x && x.line || "").startsWith("In dubbio") ? "🤔" : "🚑";
}
function injHTML(p) {
  const x = injuryOf(p); if (!x) return "";
  return `<button type="button" class="inj" data-line="${esc(x.line)}" aria-label="${esc(x.line)}">${injGlyph(x)}</button>`;
}
function hideInjPop() {
  const pop = $("inj-pop"); if (pop) pop.hidden = true;
  injPopBtn = null;
}
function showInjPop(btn) {
  let pop = $("inj-pop");
  if (!pop) {
    pop = document.createElement("div"); pop.id = "inj-pop"; pop.className = "inj-pop"; pop.hidden = true;
    document.body.appendChild(pop);
  }
  if (injPopBtn === btn && !pop.hidden) { hideInjPop(); return; }
  pop.textContent = btn.dataset.line || "";
  pop.hidden = false;
  const r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  let left = r.left + r.width / 2;
  left = Math.max(8 + w / 2, Math.min(left, innerWidth - 8 - w / 2));
  let top = r.bottom + 6;
  if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 6);
  pop.style.left = left + "px"; pop.style.top = top + "px"; pop.style.transform = "translateX(-50%)";
  injPopBtn = btn;
}
function toggleInjLine() {
  const line = $("inj-line"); if (!line || line.hidden) return;
  const on = line.classList.toggle("on");
  line.textContent = on ? (line.dataset.line || "") : "";
  line.setAttribute("aria-expanded", on ? "true" : "false");
  hideInjPop();
}

function mountStrip(el) {
  if (!el || !el.classList.contains("chips")) return;
  const buttons = () => [...el.querySelectorAll(":scope > button")];
  const edges = () => {
    const max = el.scrollWidth - el.clientWidth;
    el.classList.toggle("can-left", el.scrollLeft > 4);
    el.classList.toggle("can-right", max - el.scrollLeft > 4);
  };
  const centerOn = () => {
    const on = el.querySelector("button.on");
    if (!on || el.clientWidth <= 0) return;
    el.scrollLeft = Math.max(0, on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2);
  };
  let sizing = false;
  const equalize = () => {
    if (sizing) return;
    sizing = true;
    try {
      const bs = buttons();
      el.style.paddingLeft = "";
      el.style.paddingRight = "";
      el.style.justifyContent = "flex-start";
      if (!bs.length || el.clientWidth === 0) { edges(); return; }
      bs.forEach(b => { b.style.flex = "0 0 auto"; b.style.minWidth = "max-content"; });
      const cs = getComputedStyle(el);
      const gap = parseFloat(cs.columnGap) || 0;
      const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const widest = Math.max(...bs.map(b => b.getBoundingClientRect().width));
      const inner = el.clientWidth - pad - gap * Math.max(0, bs.length - 1);
      let equal = widest * bs.length <= inner + 0.5;
      bs.forEach(b => {
        if (equal) { b.style.flex = "1 1 0px"; b.style.minWidth = "0px"; }
        else { b.style.flex = ""; b.style.minWidth = ""; }
      });
      if (equal && bs.some(b => b.scrollWidth > b.clientWidth + 1)) {
        equal = false;
        bs.forEach(b => { b.style.flex = ""; b.style.minWidth = ""; });
      }
      if (el.scrollWidth <= el.clientWidth + 4) {
        el.style.justifyContent = "center";
        el.scrollLeft = 0;
      } else {
        const side = Math.max(12, el.clientWidth / 2);
        el.style.paddingLeft = side + "px";
        el.style.paddingRight = side + "px";
        centerOn();
      }
      edges();
    } finally { sizing = false; }
  };
  if (!el.dataset.bound) {
    el.dataset.bound = "1";
    el.addEventListener("scroll", edges, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(equalize).observe(el);
  }
  equalize();
}
function setBadge(id, n) {
  const b = $(id); if (!b) return;
  b.hidden = n <= 0; b.textContent = n > 0 ? String(n) : "";
}
function chips(el, opts, key, after) {
  el.innerHTML = "";
  opts.forEach(([v, l]) => { const b = document.createElement("button"); b.type = "button"; b.textContent = l; b.className = S[key]===v?"on":"";
    b.onclick = () => { S[key] = v; if (after) after(); render(); }; el.appendChild(b); });
  mountStrip(el);
}
function isSpecial(g) { return g[ix.st] === 9; }
function counted(list) { return list.filter(g => !isSpecial(g)); }
function spName(g) { const lab = ix.sp >= 0 && g[ix.sp] ? String(g[ix.sp]) : ""; return lab || "Speciale"; }
function spTag(g) {
  const n = spName(g);
  if (/all[-\s]?star/i.test(n)) return "ASG";
  if (/rising/i.test(n)) return "RIS";
  if (/skill/i.test(n)) return "SKL";
  if (/pre/i.test(n)) return "PRE";
  return "SPEC";
}
function inSpan(specs, core) {
  if (!core.length) return [];
  const a = core[0][ix.date], b = core[core.length - 1][ix.date];
  return specs.filter(g => g[ix.date] >= a && g[ix.date] <= b);
}
function mergeChrono(core, extra) {
  const out = core.concat(extra);
  out.sort((x, y) => x[ix.date] < y[ix.date] ? -1 : x[ix.date] > y[ix.date] ? 1 : String(x[ix.gid]).localeCompare(String(y[ix.gid])));
  return out;
}
function visibleSpecials() {
  if (S.phase !== "all" || S.opp !== "all") return [];
  return S.p.g.filter(g => isSpecial(g) && (S.venue === "all" || g[ix.ha] === S.venue));
}
function defaultLine() { const v = counted(S.p.g).map(statFn()); S.line = v.length ? Math.floor(median(v)) + 0.5 : 0.5; }

// ricerca
const q = $("q"), res = $("results"); let sel = 0, hits = [];
function search() {
  const t = q.value.trim().toLowerCase();
  if (!t) { res.style.display = "none"; return; }
  const f = fold(t);
  hits = D.players.filter(p => fold(p.name).includes(f) || fold(p.team) === f).slice(0, 30);
  sel = 0;
  res.innerHTML = hits.map((p, i) => `<li data-i="${i}" class="${i===0?"on":""}"><span>${esc(p.name)}${injHTML(p)}</span><small>${p.team} · ${p.pos} · ${counted(p.g).length} PG</small></li>`).join("");
  res.style.display = hits.length ? "block" : "none";
}
function pick(p) {
  if (!p) return;
  const same = view === "player" && S.p && String(S.p.id) === String(p.id) && !fromGame;
  q.value = ""; res.style.display = "none";
  if (same) return;
  navigate("player", "push", () => {
    S.p = p; S.opp = "all"; S.h2h = null; S.line = null; S.venue = "all"; S.phase = "all"; defaultLine();
    fromGame = null; pinGame = null;
  });
}
q.addEventListener("input", search);
q.addEventListener("keydown", e => {
  if (!hits.length) return;
  if (e.key === "ArrowDown") { sel = Math.min(sel+1, hits.length-1); } else if (e.key === "ArrowUp") { sel = Math.max(sel-1, 0); }
  else if (e.key === "Enter") { pick(hits[sel]); return; } else return;
  e.preventDefault(); [...res.children].forEach((li,i)=>li.classList.toggle("on", i===sel));
});
res.addEventListener("click", e => { const li = e.target.closest("li"); if (li) pick(hits[+li.dataset.i]); });
document.addEventListener("click", e => { if (!e.target.closest(".search")) res.style.display = "none"; });

$("minus").onclick = () => { S.line = Math.max(0, S.line - 0.5); render(); };
$("plus").onclick = () => { S.line += 0.5; render(); };
$("reset").onclick = () => { defaultLine(); render(); };
$("line").addEventListener("change", e => { const v = parseFloat(e.target.value); if (!isNaN(v)) { S.line = v; render(); } });
$("opp").addEventListener("change", e => { S.opp = e.target.value; render(); });
$("venue-seg").addEventListener("click", e => {
  const b = e.target.closest("button[data-v]");
  if (!b || b.dataset.v === S.venue) return;
  S.venue = b.dataset.v;
  render();
});
function syncVenueSeg() {
  const order = ["all", "home", "away"];
  const i = Math.max(0, order.indexOf(S.venue));
  const el = $("venue-seg");
  el.dataset.i = String(i);
  el.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b.dataset.v === order[i] ? "true" : "false"));
}

function filtered() {
  return counted(S.p.g).filter(g => (S.venue==="all"||g[ix.ha]===S.venue) && (S.phase==="all"||String(g[ix.st])===S.phase) && (S.opp==="all"||g[ix.opp]===S.opp));
}
function inCurrentSeason(g) {
  const d = g[ix.date];
  if (D.seasonStart) return d >= D.seasonStart;
  const y = String(D.season || "");
  return y.length >= 4 ? d.slice(0, 4) === y.slice(0, 4) : true;
}
function seasonName(g) {
  if (D.seasonStart && g[ix.date] < D.seasonStart) return D.historyLabel || "";
  return D.label || String(D.season || "");
}
function rate(games) {
  const f = statFn(); let o=0,u=0,p=0; games.forEach(g => { const v=f(g); v>S.line?o++:v<S.line?u++:p++; });
  return { o, u, p, n: games.length, pct: games.length ? Math.round(100*o/games.length) : null };
}
function hitCard(title, games) {
  const r = rate(games); const cls = r.pct===null?"":r.pct>=60?"good":r.pct<=40?"bad":"mid";
  const col = r.pct===null?"var(--push)":r.pct>=60?"var(--good)":r.pct<=40?"var(--bad)":"var(--mid)";
  const where = S.venue === "home" ? "casa" : S.venue === "away" ? "trasf." : "";
  const count = r.n ? `${r.o} su ${r.n}` + (r.p ? ` · ${r.p} push` : "") : "nessuna partita";
  const tail = where ? ` <span class="where">· ${where}</span>` : "";
  return `<div class="hit"><div class="t">${title}</div><div class="p ${cls}">${r.pct===null?"–":r.pct+"%"}</div>
    <div class="n">${count}${tail}</div>
    <div class="track"><div class="bar" style="width:${r.pct||0}%;background:${col}"></div></div></div>`;
}
function render() {
  const p = S.p, f = statFn(), all = counted(p.g);
  if (S.line === null) defaultLine();
  $("headshot").src = `https://a.espncdn.com/i/headshots/${L.shot}/players/full/${p.id}.png`;
  $("headshot").onerror = function(){ this.style.visibility="hidden"; }; $("headshot").style.visibility="visible";
  const po = all.filter(g => g[ix.st] === 3 || g[ix.st] === 5).length;
  const ng0 = nextGame(p.team);
  $("pname").textContent = p.name;
  const hurt = injuryOf(p);
  if (hurt) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "inj"; b.dataset.line = hurt.line; b.setAttribute("aria-label", hurt.line); b.textContent = injGlyph(hurt);
    $("pname").appendChild(b);
  }
  const injLine = $("inj-line");
  injLine.hidden = !hurt; injLine.classList.remove("on"); injLine.textContent = "";
  injLine.dataset.line = hurt ? hurt.line : ""; injLine.setAttribute("aria-expanded", "false");
  if (hurt) injLine.setAttribute("aria-label", hurt.line); else injLine.removeAttribute("aria-label");
  $("pmeta").textContent = `${p.team} · ${p.pos || "–"} · ${all.length} partite (${all.length-po} RS${po?`, ${po} playoff`:""})`;
  const pnext = $("pnext");
  pnext.hidden = !ng0;
  if (ng0) {
    const where = ng0.home.abbr === p.team ? "vs " + ng0.away.abbr : "@ " + ng0.home.abbr;
    const when = fmtWhen(ng0.date);
    pnext.dataset.game = ng0.id;
    pnext.innerHTML = `Prossima: ${esc(where)}, ${esc(when)}<span class="chev" aria-hidden="true">›</span>`;
    pnext.setAttribute("aria-label", `Apri la prossima partita, ${where}, ${when}`);
  } else {
    pnext.innerHTML = "";
    delete pnext.dataset.game;
    pnext.removeAttribute("aria-label");
  }
  const venueGames = all.filter(g => S.venue === "all" || g[ix.ha] === S.venue);
  const av = k => venueGames.length ? (venueGames.reduce((s,g)=>s+g[ix[k]],0)/venueGames.length).toFixed(1) : "–";
  $("avgs").innerHTML = [["min","MIN"],["pts","PTS"],["reb","REB"],["ast","AST"],["fg3","3PM"]].map(([k,l])=>`<div class="avg"><b>${av(k)}</b><span>${l}</span></div>`).join("");

  chips($("stats"), STATS.map(s=>[s[0],s[1]]), "stat", defaultLine);
  chips($("periods"), PERIODS, "period"); chips($("phase"), PHASE, "phase");
  syncVenueSeg();
  setBadge("pf-badge", (S.opp !== "all") + (S.phase !== "all"));
  $("line").value = S.line;
  const opps = [...new Set(all.map(g=>g[ix.opp]))].sort();
  $("opp").innerHTML = `<option value="all">Tutte</option>` + opps.map(o=>`<option value="${o}" ${S.opp===o?"selected":""}>${o} (${all.filter(g=>g[ix.opp]===o).length})</option>`).join("");

  // hit rate: calcolati su partite filtrate per casa/trasferta e fase; H2H sull'avversaria scelta
  const base = all.filter(g => (S.venue==="all"||g[ix.ha]===S.venue) && (S.phase==="all"||String(g[ix.st])===S.phase));
  const last = n => base.slice(-n);
  const ng = nextGame(p.team), ngOpp = ng ? (ng.home.abbr === p.team ? ng.away.abbr : ng.home.abbr) : null;
  const h2hOpp = S.opp !== "all" ? S.opp : (S.h2h || ngOpp || (all.length ? all[all.length-1][ix.opp] : ""));
  const h2hLbl = h2hOpp === ngOpp && S.opp === "all" && !S.h2h ? `vs ${h2hOpp} · prossima` : `vs ${h2hOpp}`;
  $("hits").innerHTML = [
    hitCard("Ultime 5", last(5)), hitCard("Ultime 10", last(10)), hitCard("Ultime 20", last(20)),
    hitCard("Stagione", base.filter(inCurrentSeason)), hitCard(h2hLbl, base.filter(g=>g[ix.opp]===h2hOpp)),
    hitCard("Casa", base.filter(g=>g[ix.ha]==="home")), hitCard("Trasferta", base.filter(g=>g[ix.ha]==="away")),
    ...(po ? [hitCard("Playoff", base.filter(g => g[ix.st] === 3 || g[ix.st] === 5))] : [])
  ].join("");

  const pool = filtered();
  const core = S.period === "all" ? pool.filter(inCurrentSeason) : pool.slice(-(+S.period));
  const specs = visibleSpecials();
  const games = mergeChrono(core, inSpan(specs, core));
  const logCore = S.period === "all" ? pool : core;
  const logGames = mergeChrono(logCore, inSpan(specs, logCore));
  const vals = core.map(f), r = rate(core);
  $("charttitle").textContent = `${statName()} · linea ${S.line} · ${core.length ? `${r.o}/${r.n} over (${r.pct}%) · media ${(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)}` : "nessuna partita con questi filtri"}`;
  drawChart(games, games.map(f));
  drawLog([...logGames].reverse());
  $("fresh").textContent = freshText();
}

function drawChart(games, vals) {
  const el = $("chart"); const W = 1100, H = 340, pl = 40, pr = 16, pt = 24, pb = 54;
  if (!games.length) { el.className = "chart"; el.innerHTML = ""; return; }
  const max = Math.max(S.line * 1.25, ...vals, 1), y = v => pt + (H-pt-pb) * (1 - v/max);
  const n = games.length, bw = (W-pl-pr)/n, gap = Math.min(10, bw*0.25);
  const step = max > 40 ? 10 : max > 16 ? 5 : max > 8 ? 2 : 1;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="sp-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" style="fill:var(--special-bg)"/><line x1="0" y1="0" x2="0" y2="8" style="stroke:var(--special)" stroke-width="3"/></pattern></defs>`;
  for (let v = 0; v <= max; v += step) s += `<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--grid)" stroke-width="1"/><text x="${pl-8}" y="${y(v)+4}" style="fill:var(--mut)" font-size="11" text-anchor="end">${v}</text>`;
  games.forEach((g, i) => {
    const v = vals[i], x = pl + i*bw + gap/2, w = bw - gap, spec = isSpecial(g);
    const c = spec ? "special" : v > S.line ? "over" : v < S.line ? "under" : "push";
    const h = Math.max(2, y(0) - y(v));
    s += `<g class="b" data-i="${i}"><rect class="bar ${c}" x="${x}" y="${y(0)-h}" width="${w}" height="${h}" rx="${Math.min(6,w/3)}"/>`;
    if (w > 14) s += `<text x="${x+w/2}" y="${y(0)-h-6}" style="fill:var(--text)" font-size="${w>30?13:10}" font-weight="700" text-anchor="middle">${Number.isInteger(v)?v:v.toFixed(1)}</text>`;
    const nearSpec = games.some((o, j) => j !== i && isSpecial(o) && Math.abs(j - i) <= 1);
    const showLbl = spec || (!nearSpec && (n <= 25 || i % Math.ceil(n/25) === 0 || i === n-1));
    const xlab = spec ? (bw >= 48 ? spName(g) : spTag(g)) : `${g[ix.ha]==="away"?"@":"vs "}${g[ix.opp]}`;
    if (showLbl) s += `<text x="${x+w/2}" y="${H-pb+18}" style="fill:${spec ? "var(--special)" : "var(--text)"}" font-size="11" font-weight="${spec ? 700 : 400}" text-anchor="middle">${esc(xlab)}</text><text x="${x+w/2}" y="${H-pb+33}" style="fill:var(--mut)" font-size="10" text-anchor="middle">${fmtD(g[ix.date])}</text>`;
    if (!spec && g[ix.st]===3 && showLbl) s += `<text x="${x+w/2}" y="${H-pb+47}" style="fill:var(--acc)" font-size="9" text-anchor="middle">PO</text>`;
    s += `<rect x="${pl+i*bw}" y="${pt}" width="${bw}" height="${H-pt-pb}" fill="transparent"/></g>`;
  });
  s += `<line x1="${pl}" x2="${W-pr}" y1="${y(S.line)}" y2="${y(S.line)}" style="stroke:var(--refline)" stroke-width="2" stroke-dasharray="7 5"/>
        <text x="${W-pr}" y="${y(S.line)-6}" style="fill:var(--refline)" font-size="12" font-weight="700" text-anchor="end">${S.line}</text></svg><div class="tip" id="tip"></div>`;
  const host = el.clientWidth || 360;
  const hasSpec = games.some(isSpecial);
  const inner = hasSpec ? Math.max(host, 1100) : host;
  const scroll = inner > host + 8;
  el.className = "chart" + (scroll ? " wide" : "");
  el.innerHTML = `<div class="chart-in"${scroll ? ` style="width:${Math.ceil(inner)}px"` : ""}>${s}</div>`;
  const tip = $("tip");
  const fillTip = i => { const g = games[i];
    const head = isSpecial(g)
      ? `<b>${fmtD(g[ix.date])} ${esc(spName(g))}</b> · ${g[ix.w]?"V":"S"} ${g[ix.ts]}-${g[ix.os]}`
      : `<b>${fmtD(g[ix.date])} ${g[ix.ha]==="away"?"@":"vs"} ${g[ix.opp]}</b> · ${g[ix.w]?"V":"S"} ${g[ix.ts]}-${g[ix.os]}${g[ix.st]===3?" · Playoff":""}`;
    tip.innerHTML = `${head}<br>${statName()}: <b>${vals[i]}</b><br>${g[ix.min]} min · ${g[ix.pts]} pt · ${g[ix.reb]} rb · ${g[ix.ast]} ast · ${g[ix.fg3]}/${g[ix.fg3a]} da 3${isSpecial(g) ? "<br>Partita speciale · non conteggiata" : ""}`; };
  el.querySelectorAll("g.b").forEach(gEl => {
    const show = ev => { fillTip(+gEl.dataset.i); placeTip(tip, ev.clientX, ev.clientY); };
    gEl.addEventListener("pointerdown", show);
    gEl.addEventListener("pointermove", ev => { if (ev.pointerType === "touch") return; show(ev); });
    gEl.addEventListener("pointerleave", ev => { if (ev.pointerType === "touch") return; tip.style.display = "none"; });
  });
}

function safeInsets() {
  const cs = getComputedStyle(document.documentElement);
  const n = p => parseFloat(cs.getPropertyValue(p)) || 0;
  return { t: n("--sat"), r: n("--sar"), b: n("--sab"), l: n("--sal") };
}
function placeTip(tip, cx, cy) {
  tip.style.visibility = "hidden";
  tip.style.display = "block";
  tip.style.left = "0px";
  tip.style.top = "0px";
  const base = tip.getBoundingClientRect();
  const w = base.width, h = base.height;
  const vv = window.visualViewport;
  const viewL = vv ? vv.offsetLeft : 0;
  const viewT = vv ? vv.offsetTop : 0;
  const viewR = viewL + (vv ? vv.width : window.innerWidth);
  const viewB = viewT + (vv ? vv.height : window.innerHeight);
  const sa = safeInsets();
  const m = 12, gap = 14;
  const narrow = window.matchMedia("(max-width: 760px)").matches;
  const bottomChrome = narrow ? Math.max(sa.b, 64) : sa.b;
  const minL = viewL + sa.l + m;
  const minT = viewT + sa.t + m;
  const maxR = viewR - sa.r - m;
  const maxB = viewB - bottomChrome - m;
  let left = cx + gap, top = cy + gap;
  if (left + w > maxR) left = cx - gap - w;
  if (top + h > maxB) top = cy - gap - h;
  if (top < minT) top = cy + gap;
  left = Math.max(minL, Math.min(left, maxR - w));
  top = Math.max(minT, Math.min(top, maxB - h));
  tip.style.left = (left - base.left) + "px";
  tip.style.top = (top - base.top) + "px";
  tip.style.visibility = "visible";
}

function drawLog(games) {
  const f = statFn();
  const head = ["Data","Avv.","Ris.","MIN","PTS","REB","AST","3PM","STL","BLK","TOV","TIRI",statName()];
  let prev = null, body = "";
  for (const g of games) {
    const name = seasonName(g);
    if (prev && name && name !== prev) body += `<tr class="season-sep"><td colspan="${head.length}">${esc(name)}</td></tr>`;
    prev = name || prev;
    const v = f(g), spec = isSpecial(g);
    const tag = spec ? ` <small class="asg">${spTag(g)}</small>` : (g[ix.st]===3||g[ix.st]===5?" <small style='color:var(--acc)'>PO</small>":"");
    const opp = spec ? esc(spName(g)) : `${g[ix.ha]==="away"?"@":"vs"} ${g[ix.opp]}`;
    body += `<tr class="${spec?"special":""}"><td>${fmtD(g[ix.date])}${tag}</td><td>${opp}</td><td>${g[ix.w]?"V":"S"} ${g[ix.ts]}-${g[ix.os]}</td>
    <td>${g[ix.min]}</td><td>${g[ix.pts]}</td><td>${g[ix.reb]}</td><td>${g[ix.ast]}</td><td>${g[ix.fg3]}/${g[ix.fg3a]}</td><td>${g[ix.stl]}</td><td>${g[ix.blk]}</td><td>${g[ix.tov]}</td><td>${g[ix.fgm]}/${g[ix.fga]}</td>
    <td class="hl ${spec?"":v>S.line?"good":v<S.line?"bad":""}">${Number.isInteger(v)?v:v.toFixed(1)}</td></tr>`;
  }
  $("log").innerHTML = `<thead><tr>${head.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody>`;
}


// ================= VISTA MERCATI (screener) =================
const MKTS = STATS.filter(s => s[0] !== "min");
const M = { stat: "pts", team: "all", opp: "all", minMin: 15, minG: 5, period: "all", venue: "all", phase: "all",
            lineMode: "median", fixed: null, lines: {}, sort: "h10", dir: -1 };
let view = "games", fromGame = null, pinGame = null, pinShown = null;
const mFn = () => MKTS.find(s => s[0] === M.stat)[2];
const mName = () => MKTS.find(s => s[0] === M.stat)[1];
const pctCls = p => p === null ? "na" : p >= 60 ? "good" : p <= 40 ? "bad" : "mid";
function mChips(el, opts, key, after) {
  el.innerHTML = "";
  opts.forEach(([v, l]) => { const b = document.createElement("button"); b.type = "button"; b.textContent = l; b.className = M[key]===v?"on":"";
    b.onclick = () => { M[key] = v; if (after) after(); renderMarkets(); }; el.appendChild(b); });
  mountStrip(el);
}
function hr(games, f, line) {
  let o = 0; games.forEach(g => { if (f(g) > line) o++; });
  return { o, n: games.length, pct: games.length ? Math.round(100 * o / games.length) : null };
}
function computeRows() {
  const f = mFn();
  const rows = [];
  for (const p of D.players) {
    if (M.team !== "all" && p.team !== M.team) continue;
    const base = p.g.filter(g => g[ix.st] !== 9 && (M.venue==="all"||g[ix.ha]===M.venue) && (M.phase==="all"||String(g[ix.st])===M.phase));
    if (!base.length) continue;
    const per = M.period === "all" ? base : base.slice(-(+M.period));
    const mins = per.reduce((s, g) => s + g[ix.min], 0) / per.length;
    if (base.length < M.minG || mins < M.minMin) continue;
    const vals = per.map(f), avg = vals.reduce((a, b) => a + b, 0) / vals.length, med = median(vals);
    const auto = Math.floor(med) + 0.5;
    const line = M.lineMode === "fixed" ? M.fixed : (M.lines[p.id] ?? auto);
    const vsG = M.opp === "all" ? [] : base.filter(g => g[ix.opp] === M.opp);
    rows.push({ p, gp: per.length, mins, avg, med, line, edited: M.lineMode !== "fixed" && M.lines[p.id] !== undefined,
      h5: hr(base.slice(-5), f, line), h10: hr(base.slice(-10), f, line), h20: hr(base.slice(-20), f, line),
      hs: hr(base, f, line), hv: hr(vsG, f, line), last10: base.slice(-10).map(f) });
  }
  return rows;
}
function spark(vals, line) {
  if (!vals.length) return "";
  const W = 100, H = 26, max = Math.max(line * 1.3, ...vals, 1), bw = W / 10;
  const y = v => H - (H - 2) * v / max;
  let s = `<svg class="spark" viewBox="0 0 ${W} ${H}" width="100" height="26">`;
  vals.forEach((v, i) => { const h = Math.max(1.5, H - y(v)); const c = v > line ? "over" : v < line ? "under" : "push"; s += `<rect class="bar ${c}" x="${i*bw+1}" y="${H-h}" width="${bw-2}" height="${h}" rx="1.6"/>`; });
  return s + `<line x1="0" x2="${W}" y1="${y(line)}" y2="${y(line)}" style="stroke:var(--refline)" stroke-width="1.2" stroke-dasharray="3 2"/></svg>`;
}
const COLS = [
  ["name","Giocatrice",r=>r.p.name], ["team","Squadra",r=>r.p.team], ["spark","Ultime 10",null],
  ["gp","PG",r=>r.gp], ["mins","MIN",r=>r.mins], ["avg","Media",r=>r.avg], ["med","Mediana",r=>r.med], ["line","Linea",r=>r.line],
  ["h5","L5",r=>r.h5.pct], ["h10","L10",r=>r.h10.pct], ["h20","L20",r=>r.h20.pct], ["hs","Stagione",r=>r.hs.pct], ["hv","vs AVV",r=>r.hv.pct]];
function renderMarkets() {
  mChips($("m-stats"), MKTS.map(s => [s[0], s[1]]), "stat", () => { M.lines = {}; M.fixed = null; });
  mChips($("m-period"), PERIODS, "period"); mChips($("m-venue"), VENUE, "venue"); mChips($("m-phase"), PHASE, "phase");
  mChips($("m-linemode"), [["median", L.line],["fixed","Linea fissa"]], "lineMode");
  setBadge("mf-badge", (M.team !== "all") + (M.opp !== "all") + (M.minMin !== 15) + (M.minG !== 5) + (M.venue !== "all") + (M.phase !== "all") + (M.lineMode !== "median"));
  const teams = [...new Set(D.players.map(p => p.team))].sort();
  $("m-team").innerHTML = `<option value="all">Tutte</option>` + teams.map(t => `<option ${M.team===t?"selected":""}>${t}</option>`).join("");
  $("m-opp").innerHTML = `<option value="all">Nessuna</option>` + teams.map(t => `<option ${M.opp===t?"selected":""}>${t}</option>`).join("");
  $("m-minmin").value = M.minMin; $("m-ming").value = M.minG;
  if (M.fixed === null) M.fixed = computeRowsAuto();
  $("fresh").textContent = freshText();
  $("m-fixed").value = M.fixed; $("m-fixedwrap").hidden = M.lineMode !== "fixed"; $("m-resetlines").hidden = M.lineMode === "fixed" || !Object.keys(M.lines).length;
  const rows = computeRows();
  const col = COLS.find(c => c[0] === M.sort) || COLS[9], get = col[2] || (r => r.h10.pct);
  rows.sort((a, b) => { const x = get(a), y = get(b);
    if (x === null || x === undefined) return 1; if (y === null || y === undefined) return -1;
    return (typeof x === "string" ? x.localeCompare(y) : x - y) * M.dir || b.gp - a.gp; });
  const hdr = COLS.map(c => c[0] === "hv" ? (M.opp === "all" ? "vs AVV" : `vs ${M.opp}`) : c[1]);
  $("m-title").textContent = `${mName()} · ${rows.length} ${L.noun} · ${M.lineMode === "fixed" ? `linea fissa ${M.fixed}` : "linea = mediana arrotondata a .5 (modificabile)"}`;
  const hcell = h => h.pct === null ? `<td class="hr na">–</td>` : `<td class="hr ${pctCls(h.pct)}"><b>${h.pct}%</b><small>${h.o}/${h.n}</small></td>`;
  $("m-table").innerHTML = `<thead><tr>${COLS.map((c, i) => `<th data-k="${c[0]}" class="${M.sort===c[0]?"sorted":""}">${hdr[i]}${M.sort===c[0]?(M.dir<0?" ▾":" ▴"):""}</th>`).join("")}</tr></thead><tbody>` +
    rows.map(r => `<tr data-id="${r.p.id}" data-line="${r.line}"><td class="pl"><b>${esc(r.p.name)}</b>${injHTML(r.p)}<small>${esc(r.p.pos||"")}</small></td><td>${r.p.team}</td><td>${spark(r.last10, r.line)}</td>
      <td>${r.gp}</td><td>${r.mins.toFixed(1)}</td><td>${r.avg.toFixed(1)}</td><td>${r.med}</td>
      <td>${M.lineMode==="fixed" ? `<b>${r.line}</b>` : `<input class="rl ${r.edited?"edited":""}" type="number" step="0.5" value="${r.line}" data-id="${r.p.id}">`}</td>
      ${hcell(r.h5)}${hcell(r.h10)}${hcell(r.h20)}${hcell(r.hs)}${M.opp==="all"?`<td class="na">–</td>`:hcell(r.hv)}</tr>`).join("") + "</tbody>";
}
// linea fissa iniziale: mediana delle mediane delle giocatrici filtrate
function computeRowsAuto() {
  const save = M.lineMode; M.lineMode = "median"; const saveL = M.lines; M.lines = {};
  const rows = computeRows(); M.lineMode = save; M.lines = saveL;
  return rows.length ? Math.floor(median(rows.map(r => r.med))) + 0.5 : 0.5;
}
$("m-table").addEventListener("click", e => {
  const th = e.target.closest("th");
  if (th) { const k = th.dataset.k; if (k === "spark") return; if (M.sort === k) M.dir *= -1; else { M.sort = k; M.dir = (k === "name" || k === "team") ? 1 : -1; } renderMarkets(); return; }
  if (e.target.closest("input")) return;
  const tr = e.target.closest("tbody tr"); if (!tr) return;
  const p = D.players.find(x => x.id === tr.dataset.id); if (!p) return;
  const line = +tr.dataset.line, stat = M.stat, phase = M.phase, h2h = M.opp === "all" ? null : M.opp;
  const period = M.period === "all" ? "10" : M.period;
  navigate("player", "push", () => {
    S.p = p; S.stat = stat; S.line = line; S.venue = "all"; S.phase = phase; S.opp = "all"; S.h2h = h2h; S.period = period;
    fromGame = null; pinGame = null;
  });
});
$("m-table").addEventListener("change", e => {
  const inp = e.target.closest("input.rl"); if (!inp) return;
  const v = parseFloat(inp.value); if (!isNaN(v)) { M.lines[inp.dataset.id] = v; renderMarkets(); }
});
$("m-team").addEventListener("change", e => { M.team = e.target.value; renderMarkets(); });
$("m-opp").addEventListener("change", e => { M.opp = e.target.value; renderMarkets(); });
$("m-minmin").addEventListener("change", e => { M.minMin = Math.max(0, +e.target.value || 0); renderMarkets(); });
$("m-ming").addEventListener("change", e => { M.minG = Math.max(1, +e.target.value || 1); renderMarkets(); });
$("m-fixed").addEventListener("change", e => { const v = parseFloat(e.target.value); if (!isNaN(v)) { M.fixed = v; renderMarkets(); } });
$("m-minus").onclick = () => { M.fixed = Math.max(0, M.fixed - 0.5); renderMarkets(); };
$("m-plus").onclick = () => { M.fixed += 0.5; renderMarkets(); };
$("m-resetlines").onclick = () => { M.lines = {}; renderMarkets(); };

// ================= PARTITE + MATCHUP =================
let SCHED = null;
const MU = { id: null, stat: "pts", venue: "side", minMin: 10 };
const ROME = { timeZone: "Europe/Rome" };
const fmtWhen = iso => { const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { ...ROME, weekday: "short", day: "2-digit", month: "short" }) + " · " + d.toLocaleTimeString("it-IT", { ...ROME, hour: "2-digit", minute: "2-digit" }); };
const logo = t => t.logo ? `<img src="${t.logo}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'phlogo'}))">` : `<span class="phlogo"></span>`;
function sideBlock(t, lose) {
  return `<div class="g-side${lose ? " lose" : ""}">${logo(t)}<b>${t.short || t.abbr}</b>${t.record ? `<small>${t.record}</small>` : ""}</div>`;
}
function nextGame(team) {
  if (!SCHED) return null; const now = Date.now();
  return SCHED.games.find(g => g.state !== "post" && new Date(g.date).getTime() > now - 4 * 3600e3 && (g.home.abbr === team || g.away.abbr === team)) || null;
}
const itNote = t => (t || "").replace(/ if necessary/i, " (se necessaria)").replace(" - Game ", " · Gara ");
const itSeries = t => t.replace("leads series", "conduce la serie").replace("wins series", "vince la serie").replace("Series tied", "Serie in parità");
function gameCard(g) {
  const fin = g.state === "post", live = g.state === "in";
  const mid = fin || live ? `<div class="g-vs score">${g.away.score ?? "–"} – ${g.home.score ?? "–"}</div>` : `<div class="g-vs">vs</div>`;
  const headline = live ? "In corso" + (g.detail ? " · " + g.detail : "") : (itNote(g.note) || (fin ? "Finale" : (g.st === 3 || g.st === 5 ? "Playoff" : "Regular season")));
  return `<div class="game" data-id="${g.id}">
    <div class="g-top"><div class="g-when">${fmtWhen(g.date)}</div><div class="g-note${live ? " live" : ""}">${headline}</div></div>
    <div class="g-match">${sideBlock(g.away, fin && !g.away.winner && g.home.winner)}${mid}${sideBlock(g.home, fin && !g.home.winner && g.away.winner)}</div>
    <div class="g-bot">${g.series ? `<div class="series">${itSeries(g.series)}</div>` : ""}<div>${[g.venue, g.tv ? "TV: " + g.tv : ""].filter(Boolean).join(" · ")}</div></div></div>`;
}
function renderGames() {
  $("fresh").textContent = freshText();
  if (!SCHED) { $("g-up").innerHTML = `<div class="empty"><b>Carico il calendario…</b></div>`; $("g-rec").innerHTML = ""; $("g-src").textContent = ""; return; }
  const now = Date.now();
  const up = SCHED.games.filter(g => g.state !== "post" && new Date(g.date).getTime() > now - 4 * 3600e3);
  let rec = SCHED.games.filter(g => g.state === "post" && now - new Date(g.date).getTime() < 7 * 864e5).reverse();
  if (!rec.length) rec = SCHED.games.filter(g => g.state === "post").slice(-6).reverse();
  const src = { live: "Calendario live ESPN", cache: "Calendario in cache", stale: "Offline: calendario salvato", offline: "Offline: calendario non disponibile" }[SCHED.source];
  $("g-src").textContent = `${src}${SCHED.ts ? " · " + new Date(SCHED.ts).toLocaleTimeString("it-IT", { ...ROME, hour: "2-digit", minute: "2-digit" }) : ""} · orari Europe/Rome`;
  $("g-up").innerHTML = up.length ? up.slice(0, 24).map(gameCard).join("") :
    `<div class="empty"><b>${SCHED.source === "offline" ? "Calendario non disponibile offline" : "Nessuna partita in programma"}</b>${SCHED.source === "offline" ? "Riapri l'app quando sei online." : L.pause}</div>`;
  $("g-rec").innerHTML = rec.length ? rec.map(gameCard).join("") : `<div class="empty"><b>Nessun risultato recente</b></div>`;
}
document.addEventListener("click", e => {
  const c = e.target.closest(".game");
  if (!c || !c.dataset.id || !c.closest("#view-games")) return;
  const id = c.dataset.id;
  pinGame = id;
  navigate("matchup", "push", () => { MU.id = id; fromGame = null; });
});
$("pnext").addEventListener("click", () => {
  const id = $("pnext").dataset.game;
  if (!id) return;
  navigate("matchup", "push", () => { MU.id = id; pinGame = id; fromGame = null; });
});

function muRows(team, opp, side) {
  const f = MKTS.find(x => x[0] === MU.stat)[2], rows = [];
  for (const p of D.players) {
    if (p.team !== team) continue;
    const all = p.g.filter(g => g[ix.st] !== 9); if (!all.length) continue;
    const l10 = all.slice(-10);
    const mins = l10.reduce((a, g) => a + g[ix.min], 0) / l10.length;
    if (mins < MU.minMin) continue;
    const vals = all.map(f), avg = vals.reduce((a, b) => a + b, 0) / vals.length, line = Math.floor(median(vals)) + 0.5;
    const base = MU.venue === "side" ? all.filter(g => g[ix.ha] === side) : all;
    rows.push({ p, mins, avg, line, gp: all.length, h10: hr(base.slice(-10), f, line), hs: hr(base, f, line),
      hv: hr(base.filter(g => g[ix.opp] === opp), f, line), last10: base.slice(-10).map(f) });
  }
  return rows.sort((a, b) => b.mins - a.mins);
}
function renderMatchup() {
  const g = SCHED && SCHED.games.find(x => x.id === MU.id);
  if (!g) {
    $("mu-head").innerHTML = `<button class="back" id="mu-back">‹ Tutte le partite</button><div class="empty"><b>${SCHED ? "Partita non disponibile" : "Carico la partita…"}</b></div>`;
    $("mu-back").onclick = () => navigate("games", "push", () => { pinGame = MU.id || null; fromGame = null; });
    $("mu-tab0").innerHTML = ""; $("mu-tab1").innerHTML = ""; $("mu-t0").textContent = ""; $("mu-t1").textContent = "";
    if (SCHED && SCHED.games && SCHED.games.length && MU.id && !SCHED.games.some(x => x.id === MU.id)) {
      queueMicrotask(() => {
        if (view === "matchup" && SCHED && SCHED.games && !SCHED.games.some(x => x.id === MU.id))
          navigate("games", "replace", () => { pinGame = null; fromGame = null; });
      });
    }
    return;
  }
  const fin = g.state === "post", live = g.state === "in";
  const mid = fin || live ? `<div class="g-vs score">${g.away.score ?? "–"} – ${g.home.score ?? "–"}</div>` : `<div class="g-vs">vs</div>`;
  const headline = live ? "In corso" + (g.detail ? " · " + g.detail : "") : (itNote(g.note) || (fin ? "Finale" : (g.st === 3 || g.st === 5 ? "Playoff" : "Regular season")));
  $("mu-head").innerHTML = `<button class="back" id="mu-back">‹ Tutte le partite</button>
    <div class="g-top"><div class="g-when">${fmtWhen(g.date)}</div><div class="g-note${live ? " live" : ""}">${headline}</div></div>
    <div class="g-match mu-match">${sideBlock(g.away, fin && !g.away.winner && g.home.winner)}${mid}${sideBlock(g.home, fin && !g.home.winner && g.away.winner)}</div>
    <div class="g-bot">${g.series ? `<div class="series">${itSeries(g.series)}</div>` : ""}<div>${[g.venue, g.tv ? "TV: " + g.tv : ""].filter(Boolean).join(" · ")}</div></div>`;
  $("mu-back").onclick = () => navigate("games", "push", () => { pinGame = MU.id; fromGame = null; });
  const setMu = (el, opts, key) => { el.innerHTML = ""; opts.forEach(([v, l]) => { const b = document.createElement("button"); b.type = "button"; b.textContent = l; b.className = String(MU[key]) === String(v) ? "on" : "";
    b.onclick = () => { MU[key] = v; renderMatchup(); }; el.appendChild(b); }); mountStrip(el); };
  setBadge("uf-badge", (MU.venue !== "side") + (Number(MU.minMin) !== 10));
  setMu($("mu-stats"), MKTS.map(s => [s[0], s[1]]), "stat");
  setMu($("mu-venue"), [["side", "Come in questa partita"], ["all", "Tutte"]], "venue");
  setMu($("mu-min"), [[0, "0"], [10, "10"], [20, "20"]], "minMin");
  const sides = [[g.away, g.home, "away"], [g.home, g.away, "home"]];
  $("mu-links").innerHTML = `<span class="lbl">Apri in Mercati</span>` + sides.map(([t, o], i) => `<button class="linkbtn" data-i="${i}">${t.abbr} vs ${o.abbr}</button>`).join("");
  $("mu-links").querySelectorAll("button").forEach(b => b.onclick = () => { const [t, o, side] = sides[+b.dataset.i];
    const preset = { stat: MU.stat, team: t.abbr, opp: o.abbr, venue: MU.venue === "side" ? side : "all", phase: "all", period: "all", minMin: MU.minMin, minG: 1, lines: {}, fixed: null, sort: "h10", dir: -1 };
    navigate("markets", "push", () => { Object.assign(M, preset); fromGame = null; pinGame = null; }); });
  const hcell = h => h.pct === null ? `<td class="hr na">–</td>` : `<td class="hr ${pctCls(h.pct)}"><b>${h.pct}%</b><small>${h.o}/${h.n}</small></td>`;
  sides.forEach(([t, o, side], i) => {
    const rows = muRows(t.abbr, o.abbr, side);
    $("mu-t" + i).textContent = `${t.name} · ${MKTS.find(x => x[0] === MU.stat)[1]}${MU.venue === "side" ? ` · solo ${side === "home" ? "casa" : "trasferta"}` : ""}`;
    $("mu-tab" + i).innerHTML = `<thead><tr><th>${L.one}</th><th>MIN</th><th>Ultime 10</th><th>Media</th><th>Linea</th><th>L10</th><th>Stagione</th><th>vs ${o.abbr}</th></tr></thead><tbody>` +
      (rows.length ? rows.map(r => `<tr data-id="${r.p.id}" data-line="${r.line}" data-opp="${o.abbr}" data-side="${side}"><td class="pl"><b>${esc(r.p.name)}</b>${injHTML(r.p)}<small>${esc(r.p.pos || "")}</small></td><td>${r.mins.toFixed(1)}</td><td>${spark(r.last10, r.line)}</td><td>${r.avg.toFixed(1)}</td><td><b>${r.line}</b></td>${hcell(r.h10)}${hcell(r.hs)}${hcell(r.hv)}</tr>`).join("")
        : `<tr><td colspan="8" class="na">${L.none}</td></tr>`) + "</tbody>";
  });
  $("fresh").textContent = freshText();
}
["mu-tab0", "mu-tab1"].forEach(id => $(id).addEventListener("click", e => {
  const tr = e.target.closest("tbody tr[data-id]"); if (!tr) return;
  const p = D.players.find(x => x.id === tr.dataset.id); if (!p) return;
  const sameGame = view === "player" && fromGame === MU.id;
  const preset = { p, stat: MU.stat, line: +tr.dataset.line, opp: "all", h2h: tr.dataset.opp, venue: "all", phase: "all", period: "10" };
  const src = MU.id;
  navigate("player", sameGame ? "replace" : "push", () => { Object.assign(S, preset); fromGame = src; pinGame = null; });
}));

function gameEl(id) {
  if (!id) return null;
  return document.querySelector('#view-games .game[data-id="' + String(id).replace(/"/g, "") + '"]');
}
function markGame(id) {
  document.querySelectorAll("#view-games .game.on").forEach(g => g.classList.remove("on"));
  const el = gameEl(id);
  if (el) el.classList.add("on");
}
function revealGame(id) {
  const el = gameEl(id);
  document.querySelectorAll("#view-games .game.on").forEach(g => g.classList.remove("on"));
  if (!el) return false;
  el.classList.add("on");
  if (pinShown !== id) { el.scrollIntoView({ block: "center", inline: "nearest" }); pinShown = id; }
  return true;
}
function snapshot() {
  return {
    view, game: MU.id || null, player: S.p ? String(S.p.id) : null,
    fromGame: fromGame || null, pin: pinGame || null, scroll: window.scrollY
  };
}
function hrefFor(st) {
  const u = new URL(location.href);
  const league = (L && L.id) || u.searchParams.get("league");
  if (league) u.searchParams.set("league", league);
  if (st.view === "player" && st.player) u.searchParams.set("player", st.player);
  else u.searchParams.delete("player");
  const game = st.view === "matchup" ? st.game : (st.view === "player" ? st.fromGame : null);
  if (game) u.searchParams.set("game", game);
  else u.searchParams.delete("game");
  u.hash = { player: "#giocatrice", markets: "#mercati", games: "#partite", matchup: "#partita-" + (st.game || "") }[st.view] || "#partite";
  return u.pathname + u.search + u.hash;
}
function readNav() {
  const q = new URLSearchParams(location.search);
  const player = q.get("player");
  const game = q.get("game");
  const h = location.hash || "";
  const hashGame = h.startsWith("#partita-") ? decodeURIComponent(h.slice(9)) : "";
  if (player) return { view: "player", player, game: game || hashGame || null };
  if (game || hashGame) return { view: "matchup", game: game || hashGame };
  if (h === "#mercati") return { view: "markets" };
  return { view: "games" };
}
function paint(opts) {
  const scroll = opts && opts.scroll != null ? opts.scroll : "auto";
  hideInjPop();
  ["player","markets","games","matchup"].forEach(k => $("view-" + k).hidden = view !== k);
  const tab = view === "matchup" ? "games" : view;
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.v === tab));
  ({ player: render, markets: renderMarkets, games: renderGames, matchup: renderMatchup })[view]();
  if (view !== "games") pinShown = null;
  if (scroll === "keep") { if (view === "games" && pinGame) markGame(pinGame); return; }
  if (view === "games" && pinGame) { if (!revealGame(pinGame)) window.scrollTo(0, 0); return; }
  window.scrollTo(0, typeof scroll === "number" ? scroll : 0);
}
function navigate(next, how, prep) {
  const pushing = how === "push" && history.state && typeof history.state.seq === "number";
  if (pushing) {
    const cur = snapshot();
    cur.seq = history.state.seq;
    history.replaceState(cur, "", hrefFor(cur));
  }
  if (prep) prep();
  view = next;
  paint({ scroll: "auto" });
  const nxt = snapshot();
  nxt.scroll = window.scrollY;
  nxt.seq = pushing ? (history.state.seq || 0) + 1 : (history.state && typeof history.state.seq === "number" ? history.state.seq : 0);
  if (pushing) history.pushState(nxt, "", hrefFor(nxt));
  else history.replaceState(nxt, "", hrefFor(nxt));
}
function applyState(st) {
  fromGame = st.fromGame || null;
  pinGame = st.pin || null;
  if (st.game) MU.id = st.game;
  if (st.view === "player") {
    const p = D.players.find(x => String(x.id) === String(st.player));
    if (!p) {
      if (st.fromGame || st.game) { MU.id = st.fromGame || st.game; fromGame = null; view = "matchup"; }
      else view = "games";
      paint({ scroll: "auto" });
      return;
    }
    if (!S.p || String(S.p.id) !== String(p.id)) { S.p = p; S.opp = "all"; S.h2h = null; S.line = null; S.venue = "all"; }
    else S.p = p;
  }
  view = st.view;
  paint({ scroll: view === "games" && pinGame ? "auto" : (typeof st.scroll === "number" ? st.scroll : 0) });
}
function bootHistory() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const nav = readNav();
  const blank = extra => Object.assign({ view: "games", game: null, player: null, fromGame: null, pin: null, scroll: 0, seq: 0 }, extra);
  const write = (st, method) => history[method](st, "", hrefFor(st));
  const player = nav.view === "player" ? D.players.find(x => String(x.id) === String(nav.player)) : null;
  const gameId = nav.view === "matchup" || nav.view === "player" ? (nav.game || null) : null;
  if (nav.view === "markets") {
    write(blank({ view: "markets" }), "replaceState");
    view = "markets"; fromGame = null; pinGame = null;
    paint({ scroll: 0 });
    return;
  }
  if (!player && !(gameId && (nav.view === "matchup" || nav.view === "player"))) {
    write(blank(), "replaceState");
    view = "games"; fromGame = null; pinGame = null;
    paint({ scroll: 0 });
    return;
  }
  let seq = 0;
  if (gameId) {
    write(blank({ pin: gameId }), "replaceState");
    MU.id = gameId; pinGame = gameId; fromGame = null; view = "matchup";
    const mst = snapshot(); mst.seq = 1; mst.scroll = 0; mst.pin = gameId;
    write(mst, "pushState");
    seq = 1;
    if (!player) paint({ scroll: 0 });
  } else write(blank(), "replaceState");
  if (player) {
    S.p = player; S.opp = "all"; S.h2h = null; S.line = null;
    fromGame = gameId; pinGame = null; view = "player";
    const pst = snapshot(); pst.seq = seq + 1; pst.scroll = 0;
    write(pst, "pushState");
    paint({ scroll: 0 });
  }
}
document.querySelectorAll("#tabs button").forEach(b => b.onclick = () => {
  const v = b.dataset.v;
  if (v === view) return;
  const wasMatchup = view === "matchup";
  const src = MU.id;
  navigate(v, "push", () => {
    if (v === "games") pinGame = wasMatchup ? src : null;
    else pinGame = null;
    if (v !== "player") fromGame = null;
  });
});
document.querySelectorAll("details.filters").forEach(d => d.addEventListener("toggle", () => d.querySelectorAll(".chips").forEach(mountStrip)));
const topEl = $("top"), searchToggle = $("search-toggle");
searchToggle.addEventListener("click", () => {
  const open = topEl.classList.toggle("search-open");
  searchToggle.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) q.focus();
});
document.addEventListener("click", e => {
  if (!topEl.classList.contains("slim") || e.target.closest(".search") || e.target.closest("#search-toggle")) return;
  topEl.classList.remove("search-open"); searchToggle.setAttribute("aria-expanded", "false");
});
let lastY = window.scrollY, acc = 0, scrollLock = 0;
function occupied(el) {
  const s = getComputedStyle(el);
  return el.offsetHeight + parseFloat(s.marginTop) + parseFloat(s.marginBottom);
}
function setSlim(on) {
  if (topEl.classList.contains("slim") === on) return;
  const y = window.scrollY;
  scrollLock = performance.now() + 220;
  acc = 0;
  if (on) {
    const flowH = occupied(topEl);
    topEl.classList.add("slim");
    const bar = Math.ceil(topEl.getBoundingClientRect().bottom);
    const pad = bar + 12;
    const next = Math.max(0, y + bar - flowH);
    if (next < 8) {
      topEl.classList.remove("slim");
      lastY = y;
      scrollLock = 0;
      return;
    }
    document.body.style.paddingTop = pad + "px";
    lastY = next;
  } else {
    const pad = parseFloat(document.body.style.paddingTop) || 0;
    topEl.classList.remove("slim", "search-open");
    searchToggle.setAttribute("aria-expanded", "false");
    document.body.style.paddingTop = "";
    const flowH = occupied(topEl);
    lastY = Math.max(0, y - (flowH - pad));
  }
  window.scrollTo(0, lastY);
}
document.addEventListener("pointerdown", e => {
  if (e.target.closest && e.target.closest("#chart g.b")) return;
  const tip = $("tip"); if (tip) tip.style.display = "none";
}, true);
document.addEventListener("click", e => {
  const b = e.target.closest(".inj, .inj-line");
  if (!b) { hideInjPop(); return; }
  e.preventDefault(); e.stopPropagation();
  if (b.classList.contains("inj-line") || b.closest("#pname")) toggleInjLine();
  else showInjPop(b);
}, true);
window.addEventListener("scroll", () => {
  hideInjPop();
  const tip = $("tip"); if (tip) tip.style.display = "none";
  const y = window.scrollY;
  if (performance.now() < scrollLock) {
    lastY = y;
    if (y < 8) setSlim(false);
    return;
  }
  const dy = y - lastY; lastY = y;
  if (y < 8) { setSlim(false); return; }
  if (document.activeElement === q) return;
  if ((dy > 0 && acc < 0) || (dy < 0 && acc > 0)) acc = 0;
  acc += dy;
  if (acc > 28) setSlim(true);
  else if (acc < -28) setSlim(false);
}, { passive: true });
window.addEventListener("popstate", () => { if (history.state && history.state.view) applyState(history.state); });

function foot() { $("foot-note").textContent = `Fonte: ${D.source} · file incluso generato ${D.generated.replace("T"," ")} · ${D.players.length} ${L.noun}. Progetto personale, nessuna affiliazione con WNBA, NBA o ESPN.`; }
function setStatus(text, tone) {
  const el = $("status"); el.textContent = text; el.className = "status" + (tone ? " " + tone : "");
  const dot = $("status-dot"); if (dot) { dot.className = "dot " + (tone || "pending"); dot.title = text; }
}
function applyChrome() {
  const lab = $("league-label"); if (lab) lab.textContent = L.label;
  const tab = document.querySelector('#tabs button[data-v="player"] .tab-l'); if (tab) tab.textContent = L.one;
  if (q) q.placeholder = L.ph;
  document.querySelectorAll(".league-opt").forEach(b => b.classList.toggle("on", b.dataset.league === L.id));
  COLS[0][1] = L.one;
}
function openLeague(data, league) {
  L = league; D = data; reindex(D.fields);
  SCHED = null; INJ_BY_ID = new Map(); INJ_BY_NAME = new Map(); hideInjPop();
  S.opp = "all"; S.h2h = null; S.line = null; S.venue = "all"; S.phase = "all";
  M.team = "all"; M.opp = "all"; M.lines = {}; M.fixed = null;
  S.p = pickStar();
  fromGame = null; pinGame = null; pinShown = null;
  applyChrome(); foot();
  bootHistory();
  setStatus("Controllo nuove partite…", "pending");
  guideMaybe();
}
const GUIDE_KEY = "prop-lab-guide";
let gi = 0, gDrag = null;
function guideSeen() {
  try { return localStorage.getItem(GUIDE_KEY) === "1"; } catch (e) { return false; }
}
function guideMark() {
  try { localStorage.setItem(GUIDE_KEY, "1"); } catch (e) {}
}
function guideAt(i, animate) {
  const root = $("guide"), view = $("guide-view"), track = $("guide-track");
  if (!root || !view || !track) return;
  const slides = [...track.querySelectorAll(":scope > .guide-slide")];
  const dots = [...document.querySelectorAll("#guide-dots .guide-dot")];
  const next = $("guide-next");
  if (!slides.length) return;
  gi = Math.max(0, Math.min(slides.length - 1, i));
  const w = view.clientWidth || 1;
  track.style.transition = animate === false ? "none" : "transform .38s cubic-bezier(.22,.85,.28,1)";
  track.style.transform = `translate3d(${-gi * w}px,0,0)`;
  if (next) next.textContent = gi === slides.length - 1 ? "Inizia" : "Avanti";
  dots.forEach((d, k) => {
    d.classList.toggle("on", k === gi);
    d.setAttribute("aria-selected", k === gi ? "true" : "false");
  });
  slides.forEach((s, k) => {
    const on = k === gi;
    s.setAttribute("aria-hidden", on ? "false" : "true");
    if (on) s.removeAttribute("inert");
    else s.setAttribute("inert", "");
  });
  const h = slides[gi].querySelector("h2");
  if (h && h.id) root.setAttribute("aria-labelledby", h.id);
}
function guideOpen() {
  const root = $("guide");
  if (!root) return;
  gDrag = null;
  root.hidden = false;
  document.body.classList.add("guide-on");
  guideAt(0, false);
  const next = $("guide-next");
  if (next) next.focus({ preventScroll: true });
}
function guideClose() {
  const root = $("guide");
  if (!root || root.hidden) return;
  gDrag = null;
  guideMark();
  root.hidden = true;
  document.body.classList.remove("guide-on");
}
function guideMaybe() {
  if (!guideSeen()) guideOpen();
}
function initGuide() {
  const root = $("guide"), view = $("guide-view"), track = $("guide-track");
  if (!root || !view || !track || root.dataset.ready) return;
  root.dataset.ready = "1";
  $("guide-skip").addEventListener("click", guideClose);
  $("guide-next").addEventListener("click", () => {
    const n = track.querySelectorAll(":scope > .guide-slide").length;
    if (gi >= n - 1) guideClose();
    else guideAt(gi + 1);
  });
  document.querySelectorAll("#guide-dots .guide-dot").forEach((d, i) => d.addEventListener("click", () => guideAt(i)));
  const help = $("help");
  if (help) help.addEventListener("click", e => { e.stopPropagation(); guideOpen(); });
  view.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    gDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, lock: false };
  });
  view.addEventListener("pointermove", e => {
    if (!gDrag || e.pointerId !== gDrag.id) return;
    const dx = e.clientX - gDrag.x, dy = e.clientY - gDrag.y;
    if (!gDrag.lock) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) { gDrag = null; return; }
      gDrag.lock = true;
      try { view.setPointerCapture(e.pointerId); } catch (err) {}
      track.style.transition = "none";
    }
    gDrag.dx = dx;
    const w = view.clientWidth || 1;
    track.style.transform = `translate3d(${-gi * w + dx}px,0,0)`;
    e.preventDefault();
  }, { passive: false });
  const endDrag = e => {
    if (!gDrag || e.pointerId !== gDrag.id) return;
    const dx = gDrag.dx, locked = gDrag.lock;
    gDrag = null;
    if (!locked) return;
    const w = view.clientWidth || 1;
    const step = Math.min(56, w * 0.18);
    if (dx <= -step) guideAt(gi + 1);
    else if (dx >= step) guideAt(gi - 1);
    else guideAt(gi);
  };
  view.addEventListener("pointerup", endDrag);
  view.addEventListener("pointercancel", endDrag);
  document.addEventListener("keydown", e => {
    if (root.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); guideClose(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); guideAt(gi + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); guideAt(gi - 1); }
  });
  window.addEventListener("resize", () => { if (!root.hidden) guideAt(gi, false); });
}
initGuide();
return {
  data: () => D,
  league: () => L,
  start: openLeague,
  setData(nd) {
    const id = S.p && S.p.id;
    D = nd; reindex(D.fields);
    S.p = (id && D.players.find(p => String(p.id) === String(id))) || pickStar();
    foot();
    paint({ scroll: "keep" });
  },
  setSchedule(sc) {
    SCHED = sc || { ts: null, games: [], source: "offline" };
    paint({ scroll: "keep" });
    if (view === "games" && pinGame && pinShown !== pinGame) revealGame(pinGame);
  },
  setStatus,
  setInjuries(list) {
    INJ_BY_ID = new Map(); INJ_BY_NAME = new Map();
    for (const x of list || []) {
      if (!x || !x.line) continue;
      const rec = { line: x.line, mark: injGlyph(x) };
      if (x.id) INJ_BY_ID.set(String(x.id), rec);
      if (x.name) INJ_BY_NAME.set(String(x.name).toLowerCase(), rec);
    }
    hideInjPop();
    if (view === "player") render();
    else if (view === "markets") renderMarkets();
    else if (view === "matchup" && SCHED) renderMatchup();
    if (q.value.trim()) search();
  }
};
})();
