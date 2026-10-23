// Dizionario dell'interfaccia. L'italiano è il ripiego se manca una chiave;
// una lingua del browser fuori da it/en/es/fr parte in inglese.
window.I18n = (() => {
  const KEY = "prop-lab-lang";
  const ORDER = ["it", "en", "es", "fr"];
  const LOCALES = { it: "it-IT", en: "en-US", es: "es-ES", fr: "fr-FR" };
  const DICT = {
    it: {
      tab_player: "Giocatore", tab_player_f: "Giocatrice", tab_player_s: "Gioc.",
      tab_board: "Listone", tab_board_s: "Listone", tab_games: "Partite", tab_games_s: "Part.",
      search_ph: "Cerca giocatore o squadra…", search_ph_f: "Cerca giocatrice o squadra…",
      noun: "giocatori", noun_f: "giocatrici",
      none: "Nessun giocatore nei dati con questi filtri", none_f: "Nessuna giocatrice nei dati con questi filtri",
      line_mode: "Linea per giocatore (mediana)", line_mode_f: "Linea per giocatrice (mediana)",
      pause_wnba: "La WNBA è in pausa: la nuova stagione di solito parte a maggio. Intanto ecco gli ultimi risultati.",
      pause_nba: "La NBA è in pausa: la nuova stagione di solito parte a ottobre. Intanto ecco gli ultimi risultati.",
      opp: "Avversario", opp_f: "Avversaria", opp_none: "Nessuno", opp_none_f: "Nessuna", team_all: "Tutte",
      filters: "Filtri", line: "Linea", median: "Mediana", fixed_line: "Linea fissa", line_basis: "Base calcolo",
      reset_lines: "Ripristina linee", team: "Squadra", min_min: "Min. minuti", min_games: "Min. partite",
      venue_pair: "Casa/Trasferta", min_avg: "Minuti medi ≥",
      board_hint: "Clic su una riga per aprire la scheda · clic sulle intestazioni per ordinare",
      gamelog: "Game log", upcoming: "Prossime partite", recent: "Risultati recenti",
      last7: "Ultimi 7 giorni", last7_tz: "Ultimi 7 giorni · orari {z}", times_tz: "orari {z}",
      credit: "Progetto personale di Nicolò Ferrari",
      foot: "Fonte: {source} · file incluso generato {generated} · {n} {noun}. Progetto personale, nessuna affiliazione con WNBA, NBA o ESPN.",
      checking: "Controllo nuove partite…", loading_league: "Carico i dati {league}…", league_unavailable: "Dati {league} non disponibili",
      loading_schedule: "Carico il calendario…", loading_game: "Carico la partita…", game_unavailable: "Partita non disponibile",
      no_upcoming: "Nessuna partita in programma", no_recent: "Nessun risultato recente",
      offline_calendar: "Calendario non disponibile offline", offline_reopen: "Riapri l'app quando sei online.",
      sched_live: "Calendario live ESPN", sched_cache: "Calendario in cache", sched_stale: "Offline: calendario salvato", sched_offline: "Offline: calendario non disponibile",
      back_games: "‹ Tutte le partite", open_board: "Apri in Listone", only_home: "solo casa", only_away: "solo trasferta",
      live: "In corso", final: "Finale", regular: "Regular season", playoff: "Playoff", halftime: "Intervallo",
      if_needed: " (se necessaria)", game_sep: " · Gara ", leads_series: "conduce la serie", wins_series: "vince la serie", series_tied: "Serie in parità",
      today: "Oggi", tomorrow: "Domani",
      over: "Over", under: "Under", push: "Push", special: "Speciale",
      where_home: "casa", where_away: "trasf.",
      neutral: "Campo neutro", neutral_short: "N", only_neutral: "solo neutre",
      venue_legend: "vs casa · @ trasferta · N campo neutro, fuori da Casa e Trasferta",
      mark_pre: "Viola = preseason", mark_po: "Oro = playoff",
      mark_asg: "All-Star = blu/rosso/bianco, esclusa dalle statistiche",
      last5: "Ultime 5", last10: "Ultime 10", last20: "Ultime 20", season: "Stagione",
      venue_all: "Tutte", venue_home: "Casa", venue_away: "Trasferta", venue_both: "Casa + Trasferta", as_this_game: "Come in questa partita",
      phase_all: "RS + Playoff", phase_rs: "Stagione regolare", phase_po: "Playoff",
      stat_pts: "Punti", stat_reb: "Rimbalzi", stat_ast: "Assist", stat_fg3: "Triple segnate",
      stat_pra: "P+R+A", stat_pr: "P+R", stat_pa: "P+A", stat_ra: "R+A",
      stat_stl: "Recuperi", stat_blk: "Stoppate", stat_sb: "Rec+Stop", stat_tov: "Palle perse", stat_min: "Minuti",
      hit_of: "{o} su {n}", hit_push: " · {p} push", no_games: "nessuna partita",
      vs_next: "vs {opp} · prossima", vs_name: "vs {opp}",
      game_one: "partita", game_many: "partite",
      pmeta: "{team} · {pos} · {n} {games} ({rs} RS{po})", pmeta_po: ", {n} playoff",
      next_prefix: "Prossima:", next_aria: "Apri la prossima partita, {where}, {when}",
      chart_sum: "{stat} · linea {line} · {o}/{n} over ({pct}%) · media {avg}",
      chart_empty: "{stat} · linea {line} · nessuna partita con questi filtri",
      tip_stats: "{min} min · {pts} pt · {reb} rb · {ast} ast · {fg3}/{fg3a} da 3",
      tip_special: "Partita speciale · non conteggiata", tip_playoff: " · Playoff",
      log_date: "Data", log_opp: "Avv.", log_res: "Ris.", log_fg: "TIRI",
      w_short: "V", l_short: "S", gp_short: "PG",
      col_team: "Squadra", col_last10: "Ultime 10", col_gp: "PG", col_min: "MIN", col_avg: "Media", col_med: "Mediana", col_line: "Linea", col_season: "Stagione", col_vs: "vs AVV",
      board_title: "{stat} · {n} {noun} · {note}",
      median_note: "linea = mediana arrotondata a .5 (modificabile)", fixed_at: "linea fissa {n}",
      fresh: "Dati {season} fino al {date} · {games} partite{hist}", fresh_hist: " · storico {label}",
      aria_help: "Guida", aria_search: "Cerca", aria_dec: "Diminuisci", aria_inc: "Aumenta", aria_venue: "Casa o trasferta", aria_guide: "Schede della guida",
      guide_skip: "Salta", guide_next: "Avanti", guide_start: "Inizia", tutorial: "Tutorial",
      guide_t0: "Le colonne", guide_p0: "Ogni colonna è una partita: verde sopra la linea, rosso sotto. La linea si regola con +/−; tocca una colonna per i dettagli.",
      guide_t1: "Le percentuali", guide_p1: "Stagione conta solo la stagione in corso; Ultime 5, 10 e 20 includono anche le passate. Il cursore Tutte, Casa o Trasferta filtra le statistiche e parte da Tutte.",
      guide_t2: "Partite e giocatori", guide_p2: "L'app si apre su Partite: tocca una partita per vedere i giocatori. «Prossima partita contro X» sotto un giocatore apre quella partita, e indietro torna lì.",
      guide_t3: "Simboli", guide_p3: "🚑 è fuori e 🤔 in dubbio; l'All-Star è a strisce blu, rosse e bianche ed è esclusa da percentuali e medie. Tocca «Prop Lab» per cambiare campionato.",
      guide_demo_next: "Prossima: vs NY",
      language: "Lingua", league: "Campionato",
      inj_out: "Out", inj_doubt: "In dubbio", inj_susp: "Squalificato", inj_susp_f: "Squalificata",
      updated_one: "Aggiornato alle {time}, 1 nuova partita", updated_many: "Aggiornato alle {time}, {n} nuove partite", updated_none: "Aggiornato alle {time} · Nessuna nuova partita",
      offline_cached: "Offline: uso aggiornamento delle {time}", offline_bundled: "Offline: dati inclusi fino al {date}",
      sp_asg: "All-Star", sp_rising: "Rising Stars", sp_skills: "Skills", sp_pre: "Preseason", sp_spec: "Speciale",
      part_knee: "ginocchio", part_leg: "gamba", part_lower_leg: "gamba", part_upper_leg: "coscia",
      part_foot: "piede", part_ankle: "caviglia", part_shoulder: "spalla", part_hip: "anca", part_back: "schiena",
      part_hand: "mano", part_wrist: "polso", part_elbow: "gomito", part_arm: "braccio", part_finger: "dito",
      part_thumb: "pollice", part_head: "testa", part_neck: "collo", part_concussion: "commozione",
      part_illness: "malattia", part_personal: "personale", part_rest: "riposo", part_coach: "scelta tecnica",
      part_achilles: "achilleo", part_hamstring: "flessori", part_groin: "inguine", part_calf: "polpaccio",
      part_quad: "quadricipite", part_abdomen: "addome", part_rib: "costola", part_ribs: "costole",
      part_eye: "occhio", part_nose: "naso", part_heel: "tallone", part_oblique: "obliquo", part_adductor: "adduttore", part_toe: "dito"
    },
    en: {
      tab_player: "Player", tab_player_f: "Player", tab_player_s: "Player",
      tab_board: "Board", tab_board_s: "Board", tab_games: "Games", tab_games_s: "Games",
      search_ph: "Search player or team…", search_ph_f: "Search player or team…",
      noun: "players", noun_f: "players",
      none: "No players in the data with these filters", none_f: "No players in the data with these filters",
      line_mode: "Line per player (median)", line_mode_f: "Line per player (median)",
      pause_wnba: "The WNBA is on break: the new season usually starts in May. Here are the latest results in the meantime.",
      pause_nba: "The NBA is on break: the new season usually starts in October. Here are the latest results in the meantime.",
      opp: "Opponent", opp_f: "Opponent", opp_none: "None", opp_none_f: "None", team_all: "All",
      filters: "Filters", line: "Line", median: "Median", fixed_line: "Fixed line", line_basis: "Sample",
      reset_lines: "Reset lines", team: "Team", min_min: "Min. minutes", min_games: "Min. games",
      venue_pair: "Home/Away", min_avg: "Avg minutes ≥",
      board_hint: "Click a row to open the player · click a header to sort",
      gamelog: "Game log", upcoming: "Upcoming games", recent: "Recent results",
      last7: "Last 7 days", last7_tz: "Last 7 days · times {z}", times_tz: "times {z}",
      credit: "A personal project by Nicolò Ferrari",
      foot: "Source: {source} · bundled file generated {generated} · {n} {noun}. A personal project, not affiliated with the WNBA, NBA, or ESPN.",
      checking: "Checking for new games…", loading_league: "Loading {league} data…", league_unavailable: "{league} data unavailable",
      loading_schedule: "Loading the schedule…", loading_game: "Loading the game…", game_unavailable: "Game unavailable",
      no_upcoming: "No games scheduled", no_recent: "No recent results",
      offline_calendar: "Schedule unavailable offline", offline_reopen: "Reopen the app when you are back online.",
      sched_live: "Live ESPN schedule", sched_cache: "Cached schedule", sched_stale: "Offline: saved schedule", sched_offline: "Offline: schedule unavailable",
      back_games: "‹ All games", open_board: "Open in Board", only_home: "home only", only_away: "away only",
      live: "Live", final: "Final", regular: "Regular season", playoff: "Playoffs", halftime: "Halftime",
      if_needed: " (if necessary)", game_sep: " · Game ", leads_series: "leads series", wins_series: "wins series", series_tied: "Series tied",
      today: "Today", tomorrow: "Tomorrow",
      over: "Over", under: "Under", push: "Push", special: "Special",
      where_home: "home", where_away: "away",
      neutral: "Neutral site", neutral_short: "N", only_neutral: "neutral only",
      venue_legend: "vs home · @ away · N neutral site, left out of Home and Away",
      mark_pre: "Purple = preseason", mark_po: "Gold = playoffs",
      mark_asg: "All-Star = blue/red/white, excluded from stats",
      last5: "Last 5", last10: "Last 10", last20: "Last 20", season: "Season",
      venue_all: "All", venue_home: "Home", venue_away: "Away", venue_both: "Home + Away", as_this_game: "As in this game",
      phase_all: "RS + Playoffs", phase_rs: "Regular season", phase_po: "Playoffs",
      stat_pts: "Points", stat_reb: "Rebounds", stat_ast: "Assists", stat_fg3: "Threes",
      stat_pra: "PRA", stat_pr: "P+R", stat_pa: "P+A", stat_ra: "R+A",
      stat_stl: "Steals", stat_blk: "Blocks", stat_sb: "Stl+Blk", stat_tov: "Turnovers", stat_min: "Minutes",
      hit_of: "{o} of {n}", hit_push: " · {p} push", no_games: "no games",
      vs_next: "vs {opp} · next", vs_name: "vs {opp}",
      game_one: "game", game_many: "games",
      pmeta: "{team} · {pos} · {n} {games} ({rs} RS{po})", pmeta_po: ", {n} playoff",
      next_prefix: "Next:", next_aria: "Open the next game, {where}, {when}",
      chart_sum: "{stat} · line {line} · {o}/{n} over ({pct}%) · avg {avg}",
      chart_empty: "{stat} · line {line} · no games with these filters",
      tip_stats: "{min} min · {pts} pts · {reb} reb · {ast} ast · {fg3}/{fg3a} from 3",
      tip_special: "Special game · not counted", tip_playoff: " · Playoffs",
      log_date: "Date", log_opp: "Opp", log_res: "Res", log_fg: "FG",
      w_short: "W", l_short: "L", gp_short: "GP",
      col_team: "Team", col_last10: "Last 10", col_gp: "GP", col_min: "MIN", col_avg: "Avg", col_med: "Median", col_line: "Line", col_season: "Season", col_vs: "vs OPP",
      board_title: "{stat} · {n} {noun} · {note}",
      median_note: "line = median rounded to .5 (editable)", fixed_at: "fixed line {n}",
      fresh: "{season} data through {date} · {games} games{hist}", fresh_hist: " · history {label}",
      aria_help: "Guide", aria_search: "Search", aria_dec: "Decrease", aria_inc: "Increase", aria_venue: "Home or away", aria_guide: "Guide cards",
      guide_skip: "Skip", guide_next: "Next", guide_start: "Start", tutorial: "Tutorial",
      guide_t0: "The bars", guide_p0: "Each bar is a game: green is over the line, red is under. Adjust the line with +/− and tap a bar for details.",
      guide_t1: "The percentages", guide_p1: "Season counts only the current season; Last 5, 10 and 20 also include previous seasons. The All, Home or Away slider filters the stats and starts on All.",
      guide_t2: "Games and players", guide_p2: "The app opens on Games: tap a game to see the players. “Next game vs X” under a player opens that game, and back returns there.",
      guide_t3: "Symbols", guide_p3: "🚑 is out and 🤔 is questionable; the All-Star bar is blue, red and white stripes and is left out of percentages and averages. Tap “Prop Lab” to change league.",
      guide_demo_next: "Next: vs NY",
      language: "Language", league: "League",
      inj_out: "Out", inj_doubt: "Questionable", inj_susp: "Suspended", inj_susp_f: "Suspended",
      updated_one: "Updated at {time}, 1 new game", updated_many: "Updated at {time}, {n} new games", updated_none: "Updated at {time} · No new games",
      offline_cached: "Offline: using the update from {time}", offline_bundled: "Offline: bundled data through {date}",
      sp_asg: "All-Star", sp_rising: "Rising Stars", sp_skills: "Skills", sp_pre: "Preseason", sp_spec: "Special",
      part_knee: "knee", part_leg: "leg", part_lower_leg: "lower leg", part_upper_leg: "thigh",
      part_foot: "foot", part_ankle: "ankle", part_shoulder: "shoulder", part_hip: "hip", part_back: "back",
      part_hand: "hand", part_wrist: "wrist", part_elbow: "elbow", part_arm: "arm", part_finger: "finger",
      part_thumb: "thumb", part_head: "head", part_neck: "neck", part_concussion: "concussion",
      part_illness: "illness", part_personal: "personal", part_rest: "rest", part_coach: "coach's decision",
      part_achilles: "Achilles", part_hamstring: "hamstring", part_groin: "groin", part_calf: "calf",
      part_quad: "quad", part_abdomen: "abdomen", part_rib: "rib", part_ribs: "ribs",
      part_eye: "eye", part_nose: "nose", part_heel: "heel", part_oblique: "oblique", part_adductor: "adductor", part_toe: "toe"
    },
    es: {
      tab_player: "Jugador", tab_player_f: "Jugadora", tab_player_s: "Jug.",
      tab_board: "Pizarra", tab_board_s: "Pizarra", tab_games: "Partidos", tab_games_s: "Part.",
      search_ph: "Busca jugador o equipo…", search_ph_f: "Busca jugadora o equipo…",
      noun: "jugadores", noun_f: "jugadoras",
      none: "Ningún jugador en los datos con estos filtros", none_f: "Ninguna jugadora en los datos con estos filtros",
      line_mode: "Línea por jugador (mediana)", line_mode_f: "Línea por jugadora (mediana)",
      pause_wnba: "La WNBA está en pausa: la nueva temporada suele empezar en mayo. Mientras tanto, estos son los últimos resultados.",
      pause_nba: "La NBA está en pausa: la nueva temporada suele empezar en octubre. Mientras tanto, estos son los últimos resultados.",
      opp: "Rival", opp_f: "Rival", opp_none: "Ninguno", opp_none_f: "Ninguna", team_all: "Todos",
      filters: "Filtros", line: "Línea", median: "Mediana", fixed_line: "Línea fija", line_basis: "Muestra",
      reset_lines: "Restablecer líneas", team: "Equipo", min_min: "Mín. minutos", min_games: "Mín. partidos",
      venue_pair: "Local/Visitante", min_avg: "Minutos medios ≥",
      board_hint: "Toca una fila para abrir la ficha · toca un encabezado para ordenar",
      gamelog: "Historial", upcoming: "Próximos partidos", recent: "Resultados recientes",
      last7: "Últimos 7 días", last7_tz: "Últimos 7 días · horarios {z}", times_tz: "horarios {z}",
      credit: "Proyecto personal de Nicolò Ferrari",
      foot: "Fuente: {source} · archivo incluido generado el {generated} · {n} {noun}. Proyecto personal, sin afiliación con la WNBA, la NBA o ESPN.",
      checking: "Buscando partidos nuevos…", loading_league: "Cargando datos de {league}…", league_unavailable: "Datos de {league} no disponibles",
      loading_schedule: "Cargando el calendario…", loading_game: "Cargando el partido…", game_unavailable: "Partido no disponible",
      no_upcoming: "No hay partidos programados", no_recent: "No hay resultados recientes",
      offline_calendar: "Calendario no disponible sin conexión", offline_reopen: "Vuelve a abrir la app cuando tengas conexión.",
      sched_live: "Calendario en vivo de ESPN", sched_cache: "Calendario en caché", sched_stale: "Sin conexión: calendario guardado", sched_offline: "Sin conexión: calendario no disponible",
      back_games: "‹ Todos los partidos", open_board: "Abrir en Pizarra", only_home: "solo local", only_away: "solo visitante",
      live: "En juego", final: "Final", regular: "Temporada regular", playoff: "Playoffs", halftime: "Descanso",
      if_needed: " (si es necesario)", game_sep: " · Partido ", leads_series: "lidera la serie", wins_series: "gana la serie", series_tied: "Serie empatada",
      today: "Hoy", tomorrow: "Mañana",
      over: "Más", under: "Menos", push: "Empate", special: "Especial",
      where_home: "local", where_away: "visit.",
      neutral: "Campo neutral", neutral_short: "N", only_neutral: "solo neutral",
      venue_legend: "vs local · @ visitante · N campo neutral, fuera de Local y Visitante",
      mark_pre: "Violeta = pretemporada", mark_po: "Oro = playoffs",
      mark_asg: "All-Star = azul/rojo/blanco, excluido de las estadísticas",
      last5: "Últimos 5", last10: "Últimos 10", last20: "Últimos 20", season: "Temporada",
      venue_all: "Todos", venue_home: "Local", venue_away: "Visitante", venue_both: "Local + Visitante", as_this_game: "Como en este partido",
      phase_all: "RS + Playoffs", phase_rs: "Temporada regular", phase_po: "Playoffs",
      stat_pts: "Puntos", stat_reb: "Rebotes", stat_ast: "Asistencias", stat_fg3: "Triples",
      stat_pra: "P+R+A", stat_pr: "P+R", stat_pa: "P+A", stat_ra: "R+A",
      stat_stl: "Robos", stat_blk: "Tapones", stat_sb: "Rob+Tap", stat_tov: "Pérdidas", stat_min: "Minutos",
      hit_of: "{o} de {n}", hit_push: " · {p} empate", no_games: "ningún partido",
      vs_next: "vs {opp} · próximo", vs_name: "vs {opp}",
      game_one: "partido", game_many: "partidos",
      pmeta: "{team} · {pos} · {n} {games} ({rs} RS{po})", pmeta_po: ", {n} playoff",
      next_prefix: "Próximo:", next_aria: "Abrir el próximo partido, {where}, {when}",
      chart_sum: "{stat} · línea {line} · {o}/{n} más ({pct}%) · media {avg}",
      chart_empty: "{stat} · línea {line} · ningún partido con estos filtros",
      tip_stats: "{min} min · {pts} pts · {reb} reb · {ast} ast · {fg3}/{fg3a} de 3",
      tip_special: "Partido especial · no cuenta", tip_playoff: " · Playoffs",
      log_date: "Fecha", log_opp: "Riv.", log_res: "Res.", log_fg: "TC",
      w_short: "V", l_short: "D", gp_short: "PJ",
      col_team: "Equipo", col_last10: "Últimos 10", col_gp: "PJ", col_min: "MIN", col_avg: "Media", col_med: "Mediana", col_line: "Línea", col_season: "Temporada", col_vs: "vs RIV",
      board_title: "{stat} · {n} {noun} · {note}",
      median_note: "línea = mediana redondeada a .5 (editable)", fixed_at: "línea fija {n}",
      fresh: "Datos {season} hasta el {date} · {games} partidos{hist}", fresh_hist: " · historial {label}",
      aria_help: "Guía", aria_search: "Buscar", aria_dec: "Bajar", aria_inc: "Subir", aria_venue: "Local o visitante", aria_guide: "Fichas de la guía",
      guide_skip: "Saltar", guide_next: "Siguiente", guide_start: "Empezar", tutorial: "Tutorial",
      guide_t0: "Las barras", guide_p0: "Cada barra es un partido: verde por encima de la línea, rojo por debajo. La línea se ajusta con +/−; toca una barra para ver el detalle.",
      guide_t1: "Los porcentajes", guide_p1: "Temporada cuenta solo la temporada en curso; Últimos 5, 10 y 20 incluyen también las anteriores. El control Todos, Local o Visitante filtra las estadísticas y empieza en Todos.",
      guide_t2: "Partidos y jugadores", guide_p2: "La app se abre en Partidos: toca un partido para ver a los jugadores. «Próximo partido contra X» bajo un jugador abre ese partido, y atrás vuelve allí.",
      guide_t3: "Símbolos", guide_p3: "🚑 es baja y 🤔 es dudoso; el All-Star lleva franjas azul, roja y blanca y queda fuera de porcentajes y medias. Toca «Prop Lab» para cambiar de competición.",
      guide_demo_next: "Próximo: vs NY",
      language: "Idioma", league: "Competición",
      inj_out: "Baja", inj_doubt: "Dudoso", inj_susp: "Suspendido", inj_susp_f: "Suspendida",
      updated_one: "Actualizado a las {time}, 1 partido nuevo", updated_many: "Actualizado a las {time}, {n} partidos nuevos", updated_none: "Actualizado a las {time} · Ningún partido nuevo",
      offline_cached: "Sin conexión: uso la actualización de las {time}", offline_bundled: "Sin conexión: datos incluidos hasta el {date}",
      sp_asg: "All-Star", sp_rising: "Rising Stars", sp_skills: "Skills", sp_pre: "Pretemporada", sp_spec: "Especial",
      part_knee: "rodilla", part_leg: "pierna", part_lower_leg: "pierna", part_upper_leg: "muslo",
      part_foot: "pie", part_ankle: "tobillo", part_shoulder: "hombro", part_hip: "cadera", part_back: "espalda",
      part_hand: "mano", part_wrist: "muñeca", part_elbow: "codo", part_arm: "brazo", part_finger: "dedo",
      part_thumb: "pulgar", part_head: "cabeza", part_neck: "cuello", part_concussion: "conmoción",
      part_illness: "enfermedad", part_personal: "personal", part_rest: "descanso", part_coach: "decisión técnica",
      part_achilles: "aquiles", part_hamstring: "isquiotibiales", part_groin: "ingle", part_calf: "pantorrilla",
      part_quad: "cuádriceps", part_abdomen: "abdomen", part_rib: "costilla", part_ribs: "costillas",
      part_eye: "ojo", part_nose: "nariz", part_heel: "talón", part_oblique: "oblicuo", part_adductor: "aductor", part_toe: "dedo del pie"
    },
    fr: {
      tab_player: "Joueur", tab_player_f: "Joueuse", tab_player_s: "Jou.",
      tab_board: "Tableau", tab_board_s: "Tableau", tab_games: "Matchs", tab_games_s: "Matchs",
      search_ph: "Chercher un joueur ou une équipe…", search_ph_f: "Chercher une joueuse ou une équipe…",
      noun: "joueurs", noun_f: "joueuses",
      none: "Aucun joueur dans les données avec ces filtres", none_f: "Aucune joueuse dans les données avec ces filtres",
      line_mode: "Ligne par joueur (médiane)", line_mode_f: "Ligne par joueuse (médiane)",
      pause_wnba: "La WNBA est en pause : la nouvelle saison commence en général en mai. En attendant, voici les derniers résultats.",
      pause_nba: "La NBA est en pause : la nouvelle saison commence en général en octobre. En attendant, voici les derniers résultats.",
      opp: "Adversaire", opp_f: "Adversaire", opp_none: "Aucun", opp_none_f: "Aucune", team_all: "Toutes",
      filters: "Filtres", line: "Ligne", median: "Médiane", fixed_line: "Ligne fixe", line_basis: "Base",
      reset_lines: "Réinitialiser les lignes", team: "Équipe", min_min: "Min. minutes", min_games: "Min. matchs",
      venue_pair: "Domicile/Extérieur", min_avg: "Minutes moy. ≥",
      board_hint: "Touchez une ligne pour ouvrir la fiche · touchez un en-tête pour trier",
      gamelog: "Journal", upcoming: "Prochains matchs", recent: "Résultats récents",
      last7: "7 derniers jours", last7_tz: "7 derniers jours · heures {z}", times_tz: "heures {z}",
      credit: "Projet personnel de Nicolò Ferrari",
      foot: "Source : {source} · fichier inclus généré le {generated} · {n} {noun}. Projet personnel, sans affiliation avec la WNBA, la NBA ou ESPN.",
      checking: "Recherche de nouveaux matchs…", loading_league: "Chargement des données {league}…", league_unavailable: "Données {league} indisponibles",
      loading_schedule: "Chargement du calendrier…", loading_game: "Chargement du match…", game_unavailable: "Match indisponible",
      no_upcoming: "Aucun match au programme", no_recent: "Aucun résultat récent",
      offline_calendar: "Calendrier indisponible hors ligne", offline_reopen: "Rouvrez l'app une fois en ligne.",
      sched_live: "Calendrier ESPN en direct", sched_cache: "Calendrier en cache", sched_stale: "Hors ligne : calendrier enregistré", sched_offline: "Hors ligne : calendrier indisponible",
      back_games: "‹ Tous les matchs", open_board: "Ouvrir dans Tableau", only_home: "domicile seulement", only_away: "extérieur seulement",
      live: "En cours", final: "Terminé", regular: "Saison régulière", playoff: "Playoffs", halftime: "Mi-temps",
      if_needed: " (si nécessaire)", game_sep: " · Match ", leads_series: "mène la série", wins_series: "remporte la série", series_tied: "Série à égalité",
      today: "Aujourd'hui", tomorrow: "Demain",
      over: "Plus", under: "Moins", push: "Nul", special: "Spécial",
      where_home: "dom.", where_away: "ext.",
      neutral: "Site neutre", neutral_short: "N", only_neutral: "neutre seulement",
      venue_legend: "vs domicile · @ extérieur · N site neutre, hors Domicile et Extérieur",
      mark_pre: "Violet = pré-saison", mark_po: "Or = playoffs",
      mark_asg: "All-Star = bleu/rouge/blanc, exclu des statistiques",
      last5: "5 derniers", last10: "10 derniers", last20: "20 derniers", season: "Saison",
      venue_all: "Tous", venue_home: "Domicile", venue_away: "Extérieur", venue_both: "Domicile + Extérieur", as_this_game: "Comme dans ce match",
      phase_all: "RS + Playoffs", phase_rs: "Saison régulière", phase_po: "Playoffs",
      stat_pts: "Points", stat_reb: "Rebonds", stat_ast: "Passes", stat_fg3: "Tirs à 3",
      stat_pra: "P+R+P", stat_pr: "P+R", stat_pa: "P+P", stat_ra: "R+P",
      stat_stl: "Interceptions", stat_blk: "Contres", stat_sb: "Int+Ctr", stat_tov: "Pertes", stat_min: "Minutes",
      hit_of: "{o} sur {n}", hit_push: " · {p} nul", no_games: "aucun match",
      vs_next: "vs {opp} · prochain", vs_name: "vs {opp}",
      game_one: "match", game_many: "matchs",
      pmeta: "{team} · {pos} · {n} {games} ({rs} RS{po})", pmeta_po: ", {n} playoffs",
      next_prefix: "Prochain :", next_aria: "Ouvrir le prochain match, {where}, {when}",
      chart_sum: "{stat} · ligne {line} · {o}/{n} plus ({pct}%) · moy. {avg}",
      chart_empty: "{stat} · ligne {line} · aucun match avec ces filtres",
      tip_stats: "{min} min · {pts} pts · {reb} reb · {ast} pas · {fg3}/{fg3a} à 3",
      tip_special: "Match spécial · non compté", tip_playoff: " · Playoffs",
      log_date: "Date", log_opp: "Adv.", log_res: "Rés.", log_fg: "Tirs",
      w_short: "V", l_short: "D", gp_short: "MJ",
      col_team: "Équipe", col_last10: "10 derniers", col_gp: "MJ", col_min: "MIN", col_avg: "Moy.", col_med: "Médiane", col_line: "Ligne", col_season: "Saison", col_vs: "vs ADV",
      board_title: "{stat} · {n} {noun} · {note}",
      median_note: "ligne = médiane arrondie à ,5 (modifiable)", fixed_at: "ligne fixe {n}",
      fresh: "Données {season} jusqu'au {date} · {games} matchs{hist}", fresh_hist: " · historique {label}",
      aria_help: "Guide", aria_search: "Chercher", aria_dec: "Diminuer", aria_inc: "Augmenter", aria_venue: "Domicile ou extérieur", aria_guide: "Fiches du guide",
      guide_skip: "Passer", guide_next: "Suivant", guide_start: "Commencer", tutorial: "Tutoriel",
      guide_t0: "Les barres", guide_p0: "Chaque barre est un match : vert au-dessus de la ligne, rouge en dessous. La ligne se règle avec +/− ; touchez une barre pour le détail.",
      guide_t1: "Les pourcentages", guide_p1: "Saison ne compte que la saison en cours ; 5, 10 et 20 derniers incluent aussi les saisons passées. Le curseur Tous, Domicile ou Extérieur filtre les stats et démarre sur Tous.",
      guide_t2: "Matchs et joueurs", guide_p2: "L'app s'ouvre sur Matchs : touchez un match pour voir les joueurs. « Prochain match contre X » sous un joueur ouvre ce match, et retour y ramène.",
      guide_t3: "Symboles", guide_p3: "🚑 est absent et 🤔 est incertain ; le All-Star est en bandes bleu, rouge et blanc et reste hors des pourcentages et des moyennes. Touchez « Prop Lab » pour changer de compétition.",
      guide_demo_next: "Prochain : vs NY",
      language: "Langue", league: "Compétition",
      inj_out: "Absent", inj_doubt: "Incertain", inj_susp: "Suspendu", inj_susp_f: "Suspendue",
      updated_one: "Mis à jour à {time}, 1 nouveau match", updated_many: "Mis à jour à {time}, {n} nouveaux matchs", updated_none: "Mis à jour à {time} · Aucun nouveau match",
      offline_cached: "Hors ligne : mise à jour de {time}", offline_bundled: "Hors ligne : données incluses jusqu'au {date}",
      sp_asg: "All-Star", sp_rising: "Rising Stars", sp_skills: "Skills", sp_pre: "Pré-saison", sp_spec: "Spécial",
      part_knee: "genou", part_leg: "jambe", part_lower_leg: "jambe", part_upper_leg: "cuisse",
      part_foot: "pied", part_ankle: "cheville", part_shoulder: "épaule", part_hip: "hanche", part_back: "dos",
      part_hand: "main", part_wrist: "poignet", part_elbow: "coude", part_arm: "bras", part_finger: "doigt",
      part_thumb: "pouce", part_head: "tête", part_neck: "cou", part_concussion: "commotion",
      part_illness: "maladie", part_personal: "personnel", part_rest: "repos", part_coach: "choix de l'entraîneur",
      part_achilles: "tendon d'Achille", part_hamstring: "ischios", part_groin: "aine", part_calf: "mollet",
      part_quad: "quadriceps", part_abdomen: "abdomen", part_rib: "côte", part_ribs: "côtes",
      part_eye: "œil", part_nose: "nez", part_heel: "talon", part_oblique: "oblique", part_adductor: "adducteur", part_toe: "orteil"
    }
  };

  function lookup(lang, key) {
    const pack = DICT[lang];
    return pack && Object.prototype.hasOwnProperty.call(pack, key) ? pack[key] : undefined;
  }
  function fill(s, vars) {
    if (!vars) return s;
    return String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] == null ? "" : String(vars[k]));
  }
  function known(key) {
    return ORDER.some(lang => lookup(lang, key) !== undefined);
  }
  let lang = detect();

  function t(key, vars) {
    const s = lookup(lang, key) ?? lookup("it", key) ?? lookup("en", key);
    return s == null ? key : fill(s, vars);
  }
  function tf(key, fem, vars) {
    if (fem && known(key + "_f")) return t(key + "_f", vars);
    return t(key, vars);
  }
  function markLang() {
    document.querySelectorAll(".lang-picks [data-lang]").forEach(b => {
      const on = b.dataset.lang === lang;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach(el => {
      const val = t(el.getAttribute("data-i18n"));
      const attr = el.getAttribute("data-i18n-attr");
      if (attr) attr.split(",").forEach(a => el.setAttribute(a.trim(), val));
      else el.textContent = val;
    });
    document.documentElement.lang = lang;
    markLang();
  }
  const listeners = [];
  function set(next) {
    if (!DICT[next]) return;
    try { localStorage.setItem(KEY, next); } catch (e) {}
    if (next === lang) { markLang(); return; }
    lang = next;
    apply();
    listeners.slice().forEach(fn => { try { fn(lang); } catch (e) { console.warn(e); } });
  }
  function detect() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && DICT[saved]) return saved;
    } catch (e) {}
    const tags = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ""];
    for (const tag of tags) {
      const base = String(tag || "").toLowerCase().split("-")[0];
      if (DICT[base]) return base;
    }
    return "en";
  }
  function fmtDate(iso, withYear) {
    const [y, m, d] = String(iso || "").slice(0, 10).split("-").map(Number);
    if (!y || !m || !d) return String(iso || "");
    const o = { day: "2-digit", month: "2-digit", timeZone: "UTC" };
    if (withYear) o.year = "numeric";
    try { return new Intl.DateTimeFormat(LOCALES[lang] || "en-US", o).format(new Date(Date.UTC(y, m - 1, d))); }
    catch (e) { return String(iso); }
  }
  function coverage() {
    const base = Object.keys(DICT.it);
    const missing = {};
    for (const code of ORDER) missing[code] = base.filter(k => lookup(code, k) == null);
    const extra = {};
    for (const code of ORDER) extra[code] = Object.keys(DICT[code]).filter(k => lookup("it", k) == null);
    return { missing, extra };
  }
  apply();
  return {
    t, tf, set, apply, fmtDate, coverage,
    on(fn) { listeners.push(fn); },
    get lang() { return lang; },
    get locale() { return LOCALES[lang] || "en-US"; },
    get order() { return ORDER.slice(); }
  };
})();
