#!/usr/bin/env python3
"""Avvia Prop Lab:  python3 server.py  →  http://localhost:8765

Serve la cartella app/ e offre /api/update, /api/schedule, /api/injuries.
Il parametro ?league=wnba|nba sceglie le API ESPN e il file incluso.
Solo libreria standard, nessuna dipendenza. Cache in memoria di 5 minuti.
"""
import json, os, re, sys, time, datetime as dt, threading
from concurrent.futures import ThreadPoolExecutor
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.parse import urlparse, parse_qs
from zoneinfo import ZoneInfo

APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")
BASES = {
    "wnba": "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba",
    "nba": "https://site.api.espn.com/apis/site/v2/sports/basketball/nba",
}
FILES = {
    "wnba": os.path.join(APP, "data", "gamelogs.json"),
    "nba": os.path.join(APP, "data", "nba", "gamelogs.json"),
}
ALIAS = {"GSW": "GS", "NYK": "NY", "SAS": "SA", "NOP": "NO", "UTA": "UTAH", "WAS": "WSH", "BRK": "BKN", "CHO": "CHA", "PHO": "PHX"}
NBA_TEAMS = {"ATL","BKN","BOS","CHA","CHI","CLE","DAL","DEN","DET","GS","HOU","IND","LAC","LAL","MEM","MIA","MIL","MIN","NO","NY","OKC","ORL","PHI","PHX","POR","SA","SAC","TOR","UTAH","WSH"}
WNBA_TEAMS = {"ATL","CHI","CON","DAL","GS","IND","LA","LV","MIN","NY","PHX","POR","SEA","TOR","WSH"}
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36"}
FIELDS = ["date","gid","st","opp","ha","w","ts","os","min","pts","reb","ast","fg3","fg3a","stl","blk","tov","fgm","fga","sp"]
CACHE, LOCK, TTL = {}, threading.Lock(), 300
ET = ZoneInfo("America/New_York")

def league_of(q):
    name = (q.get("league") or ["wnba"])[0]
    return name if name in BASES else "wnba"

def team_of(s, league):
    s = s or ""
    if league != "nba": return s
    return ALIAS.get(s.upper(), s.upper())

def minutes_of(v):
    s = str(v or "")
    if ":" in s:
        m, sec = s.split(":", 1)
        try: return round(int(m) + float(sec) / 60, 1)
        except ValueError: return 0.0
    try: return float(s or 0)
    except ValueError: return 0.0

def get(url):
    with urlopen(Request(url, headers=UA), timeout=15) as r: return json.load(r)

def months(since, today):
    y, m = int(since[:4]), int(since[5:7])
    while (y, m) <= (today.year, today.month):
        yield f"{y}{m:02d}"; m += 1
        if m > 12: m, y = 1, y + 1

def event_label(event, league):
    if allstar_event(event): return "All-Star"
    comp = (event.get("competitions") or [{}])[0]
    blob = " ".join([str(event.get("name") or ""), str(event.get("shortName") or "")] +
                    [str((n or {}).get("headline") or "") for n in (comp.get("notes") or [])])
    if re.search(r"rising\s*stars?", blob, re.I): return "Rising Stars"
    if re.search(r"skills?", blob, re.I): return "Skills"
    if (event.get("season") or {}).get("type") == 1: return "Preseason"
    if not franchise_event(event, league): return "Speciale"
    return ""

def parse(j, ev, league, sp=""):
    comp = j["header"]["competitions"][0]
    date = dt.datetime.fromisoformat(ev["date"].replace("Z", "+00:00")).astimezone(ET).date().isoformat()
    st = 9 if sp else ev["season"]["type"]
    if st == 5: st = 3
    rows = []
    for tb in j.get("boxscore", {}).get("players", []):
        me = next(c for c in comp["competitors"] if c["team"]["id"] == tb["team"]["id"]); opp = next(c for c in comp["competitors"] if c is not me)
        s = tb["statistics"][0]
        for a in s["athletes"]:
            if a.get("didNotPlay") or not a.get("stats"): continue
            v = dict(zip(s["keys"], a["stats"]))
            n = lambda k: float(v.get(k) or 0) if str(v.get(k, "0")).replace(".", "").lstrip("-").isdigit() else 0.0
            fg = [int(x) for x in str(v.get("fieldGoalsMade-fieldGoalsAttempted") or "0-0").split("-")]
            f3 = [int(x) for x in str(v.get("threePointFieldGoalsMade-threePointFieldGoalsAttempted") or "0-0").split("-")]
            opp_abbr = team_of(opp["team"].get("abbreviation"), league)
            team = team_of(tb["team"].get("abbreviation"), league)
            allowed = NBA_TEAMS if league == "nba" else WNBA_TEAMS
            if not sp and (team not in allowed or opp_abbr not in allowed): continue
            g = dict(date=date, gid=str(ev["id"]), st=st, opp=opp_abbr, ha=me["homeAway"], sp=sp or "",
                     w=bool(me.get("winner")), ts=int(float(me["score"])), os=int(float(opp["score"])), min=minutes_of(v.get("minutes")), pts=n("points"),
                     reb=n("rebounds"), ast=n("assists"), fg3=f3[0], fg3a=f3[1], stl=n("steals"), blk=n("blocks"),
                     tov=n("turnovers"), fgm=fg[0], fga=fg[1])
            rows.append(dict(pid=a["athlete"]["id"], name=a["athlete"]["displayName"], pos=a["athlete"].get("position", {}).get("abbreviation", ""),
                             team=team, g=[g[f] for f in FIELDS]))
    return rows

def allstar_event(event):
    comp = (event.get("competitions") or [{}])[0]
    ctype = comp.get("type") or {}
    if str(ctype.get("abbreviation") or "").upper() == "ALLSTAR" or str(ctype.get("id") or "") == "4":
        return True
    blob = " ".join([str(event.get("name") or ""), str(event.get("shortName") or "")] +
                    [str((n or {}).get("headline") or "") for n in (comp.get("notes") or [])])
    return re.search(r"all[-\s]?star", blob, re.I) is not None

def franchise_event(event, league):
    teams = NBA_TEAMS if league == "nba" else WNBA_TEAMS
    comp = (event.get("competitions") or [{}])[0]
    comps = comp.get("competitors") or []
    if len(comps) < 2: return True
    abbrs = [team_of((c.get("team") or {}).get("abbreviation"), league) for c in comps]
    return all(a in teams for a in abbrs)

def update(league, since, season, have):
    base = BASES[league]
    events, seen = [], set()
    for mo in months(since, dt.date.today()):
        for e in get(f"{base}/scoreboard?dates={mo}&limit=500").get("events", []):
            if e["id"] in seen: continue
            seen.add(e["id"])
            if e["status"]["type"]["name"] != "STATUS_FINAL" or e["id"] in have: continue
            if e.get("season", {}).get("year") != season: continue
            label = event_label(e, league)
            if not label and e["season"].get("type") not in (2, 3, 5): continue
            events.append((e, label))
    with ThreadPoolExecutor(6) as ex:
        rows = [r for rs in ex.map(lambda job: parse(get(f"{base}/summary?event={job[0]['id']}"), job[0], league, job[1]), events) for r in rs]
    return dict(ts=int(time.time() * 1000), games=len(events), rows=rows)

def norm(e):
    c = e["competitions"][0]
    def side(h): return next((x for x in c["competitors"] if x.get("homeAway") == h), {})
    def team(x):
        t = x.get("team", {}); sc = x.get("score")
        return dict(abbr=t.get("abbreviation"), name=t.get("displayName"), short=t.get("shortDisplayName") or t.get("name"), logo=t.get("logo", ""),
                    score=float(sc) if sc not in (None, "") else None, winner=bool(x.get("winner")),
                    record=next((r["summary"] for r in x.get("records", []) if r.get("type") == "total"), ""))
    st = e["status"]["type"]; v = c.get("venue")
    return dict(id=str(e["id"]), date=e["date"], state=st.get("state"), detail=st.get("shortDetail") or st.get("detail", ""),
                st=e.get("season", {}).get("type"), season=e.get("season", {}).get("year"), home=team(side("home")), away=team(side("away")),
                venue=", ".join(x for x in [v.get("fullName"), v.get("address", {}).get("city")] if x) if v else "",
                series=(c.get("series") or {}).get("summary", ""), note=((c.get("notes") or [{}])[0]).get("headline", ""),
                tv=", ".join(n for b in c.get("broadcasts", []) for n in b.get("names", [])))

def schedule(league):
    base = BASES[league]
    today = dt.date.today(); seen = {}
    def ym(y, m):
        y, m = y + (m - 1) // 12, (m - 1) % 12 + 1
        return f"{y}{m:02d}"
    def add(code):
        for e in get(f"{base}/scoreboard?dates={code}&limit=500").get("events", []): seen[str(e["id"])] = norm(e)
    add(ym(today.year, today.month - 1)); add(ym(today.year, today.month))
    now = dt.datetime.now(dt.timezone.utc)
    for k in range(1, 9):
        if any(g["state"] != "post" and dt.datetime.fromisoformat(g["date"].replace("Z", "+00:00")) > now for g in seen.values()): break
        add(ym(today.year, today.month + k))
    return dict(ts=int(time.time() * 1000), games=sorted(seen.values(), key=lambda g: g["date"]))

def athlete_id(a):
    hrefs = []
    href = (a.get("headshot") or {}).get("href")
    if href: hrefs.append(href)
    for link in a.get("links") or []:
        if link.get("href"): hrefs.append(link["href"])
    for href in hrefs:
        m = re.search(r"/players/full/(\d+)", href) or re.search(r"/id/(\d+)", href)
        if m: return m.group(1)
    return ""

def injuries(league):
    players = []
    for team in get(f"{BASES[league]}/injuries").get("injuries") or []:
        for inj in team.get("injuries") or []:
            a = inj.get("athlete") or {}
            if not a: continue
            players.append(dict(id=athlete_id(a), name=a.get("displayName") or "", status=inj.get("status") or "",
                                part=(inj.get("details") or {}).get("type") or ""))
    players.sort(key=lambda p: (p["name"], p["id"]))
    return dict(ts=int(time.time() * 1000), players=players)

def bundled(league):
    with open(FILES[league]) as f: d = json.load(f)
    return d["last"], d["season"], {str(g[1]) for p in d["players"] for g in p["g"]}

class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=APP, **k)
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache"); super().end_headers()
    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query); league = league_of(q)
        if u.path == "/api/schedule":
            try:
                with LOCK:
                    hit = CACHE.get(("schedule", league))
                    if not hit or time.time() - hit[0] > TTL: hit = (time.time(), schedule(league)); CACHE[("schedule", league)] = hit
                body, code = json.dumps(hit[1]).encode(), 200
            except Exception as e:
                body, code = json.dumps({"error": str(e)}).encode(), 502
            self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(body)))
            self.end_headers(); self.wfile.write(body); return
        if u.path == "/api/injuries":
            try:
                with LOCK:
                    hit = CACHE.get(("injuries", league))
                    if not hit or time.time() - hit[0] > TTL: hit = (time.time(), injuries(league)); CACHE[("injuries", league)] = hit
                body, code = json.dumps(hit[1]).encode(), 200
            except Exception as e:
                body, code = json.dumps({"error": str(e)}).encode(), 502
            self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(body)))
            self.end_headers(); self.wfile.write(body); return
        if u.path != "/api/update": return super().do_GET()
        since = q.get("since", [None])[0]; season = int(q.get("season", [0])[0] or 0)
        try:
            last, bseason, have = bundled(league)
            since, season = since or last, season or bseason
            key = (league, since, season)
            with LOCK:
                hit = CACHE.get(key)
                if not hit or time.time() - hit[0] > TTL:
                    hit = (time.time(), update(league, since, season, have)); CACHE[key] = hit
            body, code = json.dumps(hit[1]).encode(), 200
        except Exception as e:
            body, code = json.dumps({"error": str(e)}).encode(), 502
        self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(body)))
        self.end_headers(); self.wfile.write(body)
    def log_message(self, *a): pass

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f"Prop Lab su http://localhost:{port}  (Ctrl+C per fermare)")
    ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
