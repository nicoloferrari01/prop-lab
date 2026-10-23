#!/usr/bin/env python3
"""Scarica i game log WNBA e NBA e genera i file in app/data.

WNBA: sportsdataverse (wehoop) player_box_{anno}.parquet + scoreboard ESPN.
NBA: sportsdataverse / hoopR player_box_{anno finale}.parquet per la stagione
in corso e quella precedente, poi le partite ESPN ancora assenti dal parquet.

Uso:
  python3 fetch_data.py                  # entrambe le leghe
  python3 fetch_data.py --league wnba --season 2026
  python3 fetch_data.py --league nba
"""
import argparse, datetime as dt, io, json, os, re, sys
import pandas as pd, requests

HERE = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "Mozilla/5.0 (prop-lab personal project)"}
ESPN = "https://site.api.espn.com/apis/site/v2/sports/basketball/{league}"
PARQUET = "https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_{league}_player_boxscores/player_box_{season}.parquet"
FIELDS = ["date","gid","st","opp","ha","w","ts","os","min","pts","reb","ast","fg3","fg3a","stl","blk","tov","fgm","fga","sp","ns"]
ALLSTAR_ABBR = {"COOP", "SPO", "STARS", "STRIPES", "WORLD"}
NBA_TEAMS = {"ATL","BKN","BOS","CHA","CHI","CLE","DAL","DEN","DET","GS","HOU","IND","LAC","LAL","MEM","MIA","MIL","MIN","NO","NY","OKC","ORL","PHI","PHX","POR","SA","SAC","TOR","UTAH","WSH"}
WNBA_TEAMS = {"ATL","CHI","CON","DAL","GS","IND","LA","LV","MIN","NY","PHX","POR","SEA","TOR","WSH"}
NBA_ALIAS = {"GSW":"GS","NYK":"NY","SAS":"SA","NOP":"NO","UTA":"UTAH","WAS":"WSH","WSH":"WSH","BRK":"BKN","CHO":"CHA","PHO":"PHX","GS":"GS","NO":"NO","NY":"NY","SA":"SA"}

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

def blank(v):
    if v is None: return ""
    try:
        if pd.isna(v): return ""
    except TypeError:
        pass
    return v

def ident(v):
    """Gli id ESPN a volte arrivano come float dal parquet (3112335.0)."""
    v = blank(v)
    if isinstance(v, float):
        return str(int(v)) if v.is_integer() else str(v)
    s = str(v).strip()
    if s.endswith(".0"):
        try: return str(int(float(s)))
        except ValueError: return s
    return s

def team_of(v, alias):
    s = str(blank(v) or "")
    if not alias: return s
    s = s.upper()
    return NBA_ALIAS.get(s, s)

def minutes_of(v):
    s = str(blank(v) if not isinstance(v, (int, float)) else v)
    if s in ("", "None"): return 0.0
    if ":" in s:
        m, sec = s.split(":", 1)
        try: return int(m) + int(float(sec)) / 60
        except ValueError: return 0.0
    try: return float(s)
    except ValueError: return 0.0

def num(v):
    try:
        if v is None or (isinstance(v, float) and pd.isna(v)): return 0.0
        return float(v)
    except (TypeError, ValueError):
        return 0.0

def nba_current_season(today):
    """Anno ESPN della stagione NBA: è l'anno in cui la stagione finisce (2026-27 → 2027)."""
    return today.year + 1 if today.month >= 10 else today.year

def save_injuries(league, path, global_name):
    url = ESPN.format(league=league) + "/injuries"
    try:
        j = requests.get(url, headers=UA, timeout=30)
        j.raise_for_status(); j = j.json()
    except Exception as e:
        print(f"Injuries {league} skipped:", e); return
    players = []
    for team in j.get("injuries") or []:
        for inj in team.get("injuries") or []:
            a = inj.get("athlete") or {}
            if not a.get("displayName") and not athlete_id(a): continue
            players.append(dict(id=athlete_id(a), name=a.get("displayName") or "", status=inj.get("status") or "",
                                part=(inj.get("details") or {}).get("type") or ""))
    players.sort(key=lambda p: (p["name"], p["id"]))
    payload = dict(players=players)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f: json.dump(payload, f, separators=(",", ":"), ensure_ascii=False)
    with open(path.replace(".json", ".js"), "w") as f:
        f.write(f"window.{global_name}=" + json.dumps(payload, separators=(",", ":"), ensure_ascii=False) + ";")
    print(f"Injuries {league}: {len(players)}")

def abbr_label(team, opp):
    if {team, opp} & ALLSTAR_ABBR: return "All-Star"
    return "Speciale"

def load_sdv(league, season, teams=None):
    url = PARQUET.format(league=league, season=season)
    r = requests.get(url, headers=UA, timeout=120)
    if r.status_code == 404:
        print(f"Parquet assente: {url}")
        return []
    r.raise_for_status()
    d = pd.read_parquet(io.BytesIO(r.content))
    alias = teams is not None
    rows = []
    for x in d.itertuples(index=False):
        dnp = getattr(x, "did_not_play", False)
        if dnp is True or dnp == 1 or pd.isna(getattr(x, "minutes", None)): continue
        st = int(x.season_type)
        if st == 5: st = 3  # play-in: stesso filtro Playoff della WNBA
        sp = "Preseason" if st == 1 else ""
        if st not in (1, 2, 3): continue
        team, opp = team_of(x.team_abbreviation, alias), team_of(x.opponent_team_abbreviation, alias)
        if not sp and teams and (team not in teams or opp not in teams): sp = abbr_label(team, opp)
        if sp: st = 9
        rows.append(dict(gid=ident(x.game_id), date=str(x.game_date)[:10], st=st, sp=sp, ns=0,
            pid=ident(x.athlete_id), name=str(x.athlete_display_name), pos=str(blank(x.athlete_position_abbreviation)),
            team=team, opp=opp, ha=str(x.home_away),
            w=bool(x.team_winner), ts=int(num(x.team_score)), os=int(num(x.opponent_team_score)),
            min=num(x.minutes), pts=num(x.points), reb=num(x.rebounds), ast=num(x.assists),
            fg3=num(x.three_point_field_goals_made), fg3a=num(x.three_point_field_goals_attempted),
            stl=num(x.steals), blk=num(x.blocks), tov=num(x.turnovers),
            fgm=num(x.field_goals_made), fga=num(x.field_goals_attempted)))
    return rows

def espn_game(league, gid, date, st, teams=None, sp=""):
    if sp: st = 9
    elif st == 5: st = 3
    j = requests.get(ESPN.format(league=league) + f"/summary?event={gid}", headers=UA, timeout=30).json()
    comp = j["header"]["competitions"][0]
    neutral = 1 if comp.get("neutralSite") else 0
    byid = {c["team"]["id"]: c for c in comp["competitors"]}
    rows = []
    alias = teams is not None
    for tb in j["boxscore"]["players"]:
        me = byid[tb["team"]["id"]]; opp = [c for c in comp["competitors"] if c is not me][0]
        s = tb["statistics"][0]; k = s["keys"]
        team, opp_abbr = team_of(tb["team"].get("abbreviation"), alias), team_of(opp["team"].get("abbreviation"), alias)
        if not sp and teams and (team not in teams or opp_abbr not in teams): continue
        for a in s["athletes"]:
            if a.get("didNotPlay") or not a.get("stats"): continue
            v = dict(zip(k, a["stats"]))
            def n(key):
                try: return float(v[key])
                except (KeyError, TypeError, ValueError): return 0.0
            fg = str(v.get("fieldGoalsMade-fieldGoalsAttempted") or "0-0").split("-")
            f3 = str(v.get("threePointFieldGoalsMade-threePointFieldGoalsAttempted") or "0-0").split("-")
            rows.append(dict(gid=str(gid), date=date, st=st, sp=sp or "", ns=neutral, pid=str(a["athlete"]["id"]), name=a["athlete"]["displayName"],
                pos=(a["athlete"].get("position") or {}).get("abbreviation") or "", team=team,
                opp=opp_abbr, ha=me["homeAway"], w=bool(me.get("winner")),
                ts=int(float(me["score"])), os=int(float(opp["score"])), min=minutes_of(v.get("minutes")),
                pts=n("points"), reb=n("rebounds"), ast=n("assists"), fg3=float(f3[0] or 0), fg3a=float(f3[1] or 0),
                stl=n("steals"), blk=n("blocks"), tov=n("turnovers"), fgm=float(fg[0] or 0), fga=float(fg[1] or 0)))
    return rows

def event_blob(event):
    comp = (event.get("competitions") or [{}])[0]
    return " ".join([str(event.get("name") or ""), str(event.get("shortName") or "")] +
                    [str((n or {}).get("headline") or "") for n in (comp.get("notes") or [])])

def event_label(event, teams, alias):
    """All-Star, Rising Stars, Skills, preseason, o avversari non di franchigia. NBA Cup e Commissioner's Cup restano partite vere."""
    if allstar_event(event): return "All-Star"
    blob = event_blob(event)
    if re.search(r"rising\s*stars?", blob, re.I): return "Rising Stars"
    if re.search(r"skills?", blob, re.I): return "Skills"
    if (event.get("season") or {}).get("type") == 1: return "Preseason"
    if teams is not None and not franchise_event(event, teams, alias): return "Speciale"
    return ""

def allstar_event(event):
    """All-Star resta season type 2 su ESPN: si riconosce dal tipo gara o dalla nota."""
    comp = (event.get("competitions") or [{}])[0]
    ctype = comp.get("type") or {}
    if str(ctype.get("abbreviation") or "").upper() == "ALLSTAR" or str(ctype.get("id") or "") == "4":
        return True
    return re.search(r"all[-\s]?star", event_blob(event), re.I) is not None

def franchise_event(event, teams, alias):
    if not teams: return True
    comp = (event.get("competitions") or [{}])[0]
    comps = comp.get("competitors") or []
    if len(comps) < 2: return True
    abbrs = [team_of((c.get("team") or {}).get("abbreviation"), alias) for c in comps]
    return all(a in teams for a in abbrs)

def fill_espn(rows, league, season_year, start, end, teams=None, stop_empty=None):
    have = {r["gid"] for r in rows}
    added, day, empty = [], start, 0
    while day <= end:
        sb = requests.get(ESPN.format(league=league) + f"/scoreboard?dates={day.strftime('%Y%m%d')}", headers=UA, timeout=30).json()
        found = False
        for e in sb.get("events", []):
            sy = (e.get("season") or {}).get("year")
            if sy != season_year: continue
            st = (e.get("season") or {}).get("type", 2)
            if st == 5: st = 3
            sp = event_label(e, teams, teams is not None)
            if not sp and st not in (2, 3): continue
            if e["status"]["type"]["name"] != "STATUS_FINAL": continue
            found = True
            if str(e["id"]) in have: continue
            rows += espn_game(league, e["id"], day.isoformat(), 9 if sp else st, teams, sp)
            have.add(str(e["id"])); added.append(str(e["id"]))
        if stop_empty is not None:
            empty = 0 if found else empty + 1
            if empty >= stop_empty: break
        day += dt.timedelta(days=1)
    return added

def mark_neutral(rows, league):
    """ESPN still assigns homeAway at a neutral site. ns keeps those games out of Home/Away."""
    if not rows: return
    dates = [dt.date.fromisoformat(r["date"]) for r in rows]
    start, end = min(dates), max(dates)
    neutral, y, m = set(), start.year, start.month
    while (y, m) <= (end.year, end.month):
        sb = requests.get(ESPN.format(league=league) + f"/scoreboard?dates={y}{m:02d}&limit=500", headers=UA, timeout=30).json()
        for e in sb.get("events") or []:
            c = (e.get("competitions") or [{}])[0]
            if c.get("neutralSite"): neutral.add(str(e["id"]))
        m += 1
        if m > 12: m, y = 1, y + 1
    for r in rows:
        if str(r["gid"]) in neutral: r["ns"] = 1

def pack(rows, season, source, sdv_last, added, label=None):
    for r in rows:
        for key in ("pts","reb","ast","fg3","fg3a","stl","blk","tov","fgm","fga","min"):
            r[key] = round(float(r[key]), 1) if key == "min" else int(round(float(r[key])))
    rows.sort(key=lambda r: (r["date"], r["gid"], r["pid"]))
    players = {}
    for r in rows:
        p = players.setdefault(r["pid"], dict(id=r["pid"], name=r["name"], pos=r["pos"], team="" if r["st"] == 9 else r["team"], g=[]))
        p["name"] = r["name"]
        if r["st"] != 9: p["team"] = r["team"]
        elif not p["team"]: p["team"] = r["team"]
        if r["pos"]: p["pos"] = r["pos"]
        p["g"].append([r[k] for k in FIELDS])
    out = dict(season=season, generated=dt.datetime.now().astimezone().isoformat(timespec="minutes"),
        source=source, sdv_last=sdv_last, espn_added=added,
        first=rows[0]["date"] if rows else "", last=rows[-1]["date"] if rows else "",
        games=len({r["gid"] for r in rows}), fields=FIELDS,
        players=sorted(players.values(), key=lambda p: -sum(g[8] for g in p["g"])))
    if label: out["label"] = label
    return out

def write_bundle(out, path, global_name):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f: json.dump(out, f, separators=(",", ":"), ensure_ascii=False)
    with open(path.replace(".json", ".js"), "w") as f:
        f.write(f"window.{global_name}=" + json.dumps(out, separators=(",", ":"), ensure_ascii=False) + ";")

def season_label(end_year):
    return f"{end_year - 1}-{str(end_year)[2:]}"

def fetch_one(league, season, path, global_name, source, teams=None, label=None, stop_empty=None, end=None):
    rows = load_sdv(league, season, teams)
    dates = [dt.date.fromisoformat(r["date"]) for r in rows]
    if league == "wnba":
        start = max(dates) if dates else dt.date(season, 5, 1)
    else:
        start = max(dates) if dates else dt.date(season - 1, 10, 1)
    sdv_last = start.isoformat() if rows else ""
    today = dt.date.today()
    added = fill_espn(rows, league, season, start, end or today, teams, stop_empty) if start <= (end or today) else []
    mark_neutral(rows, league)
    out = pack(rows, season, source, sdv_last, added, label)
    write_bundle(out, path, global_name)
    who = "giocatrici" if league == "wnba" else "giocatori"
    print(f"{league.upper()} {label or season}: {sum(len(p['g']) for p in out['players'])} righe, {len(out['players'])} {who}, {out['games']} partite, {out['first']} → {out['last']}; ESPN aggiunte: {added}")
    return out

def fetch_wnba(season):
    fetch_one("wnba", season, os.path.join(HERE, "app", "data", "gamelogs.json"), "WNBA_DATA",
              "sportsdataverse/wehoop (ESPN box score) + ESPN API", WNBA_TEAMS)
    save_injuries("wnba", os.path.join(HERE, "app", "data", "injuries.json"), "WNBA_INJURIES")

def fetch_nba(current):
    history = current - 1
    base = os.path.join(HERE, "app", "data", "nba")
    fetch_one("nba", history, os.path.join(base, "history.json"), "NBA_HISTORY",
              "sportsdataverse/hoopR (ESPN box score) + ESPN API", NBA_TEAMS, season_label(history), stop_empty=14)
    fetch_one("nba", current, os.path.join(base, "gamelogs.json"), "NBA_DATA",
              "sportsdataverse/hoopR (ESPN box score) + ESPN API", NBA_TEAMS, season_label(current))
    save_injuries("nba", os.path.join(base, "injuries.json"), "NBA_INJURIES")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--league", choices=["wnba", "nba", "all"], default="all")
    ap.add_argument("--season", type=int, default=None)
    a = ap.parse_args()
    today = dt.date.today()
    if a.league in ("wnba", "all"):
        fetch_wnba(a.season or today.year)
    if a.league in ("nba", "all"):
        # --season sulla WNBA non deve spostare l'anno NBA quando si aggiornano entrambe.
        cur = a.season if a.league == "nba" and a.season else nba_current_season(today)
        fetch_nba(cur)

if __name__ == "__main__": main()
