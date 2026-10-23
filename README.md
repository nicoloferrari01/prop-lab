# Prop Lab (prototipo)

Sito live: https://nicoloferrari01.github.io/wnba-prop-lab/

Pages source must be set to "GitHub Actions" (Settings → Pages → Source).

WNBA e NBA nello stesso visualizzatore. Il titolo in testata mostra la lega corrente; toccandolo si sceglie WNBA o NBA. La scelta resta nel browser e nell'URL (`?league=nba` o `?league=wnba`). Senza una scelta salvata, d'ottobre a giugno si apre l'NBA, altrimenti la WNBA. All'apertura si vede Partite; `?player=` apre quella scheda e la riga «Prossima» apre la partita in calendario.

Visualizzatore stile Outlier: barre partita per partita vs una linea regolabile, hit rate (ultime 5/10/20, stagione, vs avversaria, casa/trasferta, playoff). I dati NBA (stagione in corso e quella precedente) si caricano solo quando si sceglie l'NBA.

## Viste
- Giocatrice (`#giocatrice`): barre partita per partita vs linea, hit rate, game log.
- Mercati (`#mercati`): screener di tutte le giocatrici per mercato (Punti, Rimbalzi, Assist, Triple segnate, P+R+A, P+R, P+A, R+A, Recuperi, Stoppate, Rec+Stop, Palle perse), con linea per giocatrice (mediana arrotondata a .5, modificabile per riga) o linea fissa, hit rate L5/L10/L20/stagione/vs avversaria, sparkline ultime 10, filtri e ordinamento. Clic su una riga apre la scheda con lo stesso mercato e la stessa linea.
- Partite (`#partite`): prossime partite e risultati degli ultimi 7 giorni dallo scoreboard ESPN (live all'apertura, cache 10 min, fallback `/api/schedule` di server.py), orari nel fuso del browser (sigla breve, es. CET o EDT), raggruppati per Oggi/Domani sulla data locale, loghi, casa/trasferta, stato serie playoff, arena, TV. Fuori stagione: messaggio + ultimi risultati.
- Matchup (`#partita-<id>`): roster delle due squadre (giocatrici nei dati) con media, linea, sparkline, hit rate L10/stagione/vs avversaria, filtro casa/trasferta come nella partita; clic su una giocatrice apre la scheda, i pulsanti aprono Mercati filtrato (squadra A vs B).
- Nella scheda giocatrice la card "vs" usa automaticamente l'avversaria della prossima partita in calendario.

## Avvio (un solo comando)
    python3 server.py          # poi apri http://localhost:8765
Solo libreria standard Python, nessuna installazione.

## Aggiornamento automatico all'apertura
Ogni volta che apri l'app, `app/update.js` chiede alle API pubbliche ESPN (scoreboard mensile + summary, CORS aperto)
le partite concluse più recenti dell'ultima data nel file incluso, le unisce nel browser e mostra in alto
"Aggiornato alle HH:MM, X nuove partite" oppure "Nessuna nuova partita".
- Cache nel browser (localStorage) di 10 minuti: riaprendo subito non rifà le chiamate.
- Se la chiamata diretta fallisce, ripiega su `/api/update` di `server.py` (stesso aggiornamento lato server, cache 5 min).
- Offline: usa l'ultimo aggiornamento in cache o i dati inclusi, con avviso "Offline: …".
- Fuori stagione: nessuna partita nuova = "Nessuna nuova partita", nessun errore.

## Rigenerare il file dati incluso (consigliato ogni tanto / a inizio stagione)
    python3 -m venv .venv && .venv/bin/pip install pandas pyarrow requests   # solo la prima volta
    .venv/bin/python fetch_data.py                     # WNBA anno corrente + NBA (stagione in corso e precedente)
    .venv/bin/python fetch_data.py --league wnba --season 2026
    .venv/bin/python fetch_data.py --league nba
Genera `app/data/gamelogs.js` (WNBA) e `app/data/nba/` (stagione corrente, storico, infortuni).
`.github/workflows/refresh-data.yml` rifà lo stesso aggiornamento ogni giorno alle 06:00 UTC e, se `app/data` cambia, fa commit e ridistribuisce Pages (un push del token non rilancia il workflow di deploy).

## Screenshot
    .venv/bin/pip install playwright && .venv/bin/python -m playwright install chromium
    .venv/bin/python screenshot.py   # con server.py attivo

Fonti: sportsdataverse/wehoop (`espn_wnba_player_boxscores`) e sportsdataverse/hoopR (`espn_nba_player_boxscores`) + API pubbliche ESPN (non ufficiali).
