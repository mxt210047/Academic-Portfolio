# THE GRIND

A student command center for the four things this portfolio is actually about: **jobs, sports, anime, and Xbox**.

THE GRIND treats internships like missions, Dallas box scores like a ticker, the watch queue like a season pass, and Xbox hours like ranked grind. Progress across all four lanes feeds one Gamerscore and a trophy case.

## Run it

From this folder:

```bash
python3 server.py
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

The local server also proxies ESPN scoreboards so the Sideline can refresh live. Opening `index.html` directly still works; scores fall back to a seeded board (Rangers, Cowboys, Stars, and the rest of the slate).

## Lanes

| Lane | What it tracks |
| --- | --- |
| Lobby | Player card, daily challenges, now-playing tiles, activity feed |
| Missions | Internship kanban plus a DFW scout list (State Farm, Capital One, AA, TI, UTD OIT, …) |
| Sideline | Followed teams and box scores (Cowboys, Rangers, Mavs, Stars, Comets) |
| Queue | Anime shelves with AniList search, episode logging, sports-anime crossovers |
| Library | Xbox loadout, hours, completion, session logging |

Daily challenges award **G**. Bigger moments — first application, interview arc, offer, finished series — pop an Xbox-style achievement toast.

## Stack

Static HTML, CSS, and JavaScript. No build step. Optional `server.py` for live scores. AniList GraphQL for anime search. Data stays in `localStorage` so a demo session survives refresh.

Built as a featured piece in the UTD Information Technology & Systems academic portfolio.
