# Blackboard → Dad Email Agent

Watches your UTD Blackboard "To Do" activity stream and emails your dad
whenever something NEW shows up that's due within the next week (configurable),
so he can see what you're working on without you texting him the same link
over and over.

## How it works (and why)

UTD Blackboard logs in through SSO + Duo (2FA), so a script can't safely
auto-type your password every run. Instead:

1. **`setup_session.py`** opens a real browser window. You log in by hand
   (password + Duo) just like normal. Once logged in, it saves your
   session cookies to `auth_state.json`.
2. **`check_assignments.py`** reuses that saved session (headless, no
   visible window) to load your activity stream, find items due soon,
   and email any *new* ones to your dad. It keeps a small `seen_assignments.json`
   file so he doesn't get the same item every single run.

Run `check_assignments.py` on a schedule (cron / Task Scheduler) — e.g. once
an hour. When the saved session eventually expires (Blackboard logs you out),
just re-run `setup_session.py` once.

## Setup

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt --break-system-packages
   playwright install chromium
   ```

2. **Log in once**
   ```bash
   python setup_session.py
   ```
   A browser opens → log in to Blackboard (NetID + Duo) → once you see your
   dashboard, press Enter in the terminal. This creates `auth_state.json`.

3. **Configure email**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   - `EMAIL_TO` = your dad's email address
   - `EMAIL_FROM` / `EMAIL_PASSWORD` = a Gmail account + an **app password**
     (Google Account → Security → 2-Step Verification → App passwords).
     Using your real Gmail password won't work and isn't recommended anyway.
   - `DAYS_AHEAD` = how far ahead counts as "due soon" (default 7 days)

4. **Test it manually**
   ```bash
   python check_assignments.py
   ```
   First run will likely email everything currently in your "To Do" list
   (since nothing's been "seen" yet). After that, only new items trigger
   an email.

5. **Schedule it** (Linux/Mac example, runs hourly)
   ```bash
   crontab -e
   ```
   Add:
   ```
   0 * * * * cd /full/path/to/blackboard_agent && /usr/bin/python3 check_assignments.py >> log.txt 2>&1
   ```
   On Windows, use Task Scheduler to run `check_assignments.py` hourly.

## Tuning the scraper

Blackboard's page layout/text can vary by course/instructor. `parse_items()`
in `check_assignments.py` looks for lines matching `"Due <Month> <Day>..."`
and assumes the title and course name are the two lines above it.

If emails come back empty or look wrong:
- Run `python setup_session.py`, log in, and leave the browser open.
- Open Chrome DevTools on the activity stream and look at the actual text
  of a "To Do" item to see its real format.
- Adjust the regex / line offsets in `parse_items()` to match.

## A few notes

- **Don't share `auth_state.json` or `.env`** — they contain your live
  Blackboard session and email credentials.
- Hourly checks are reasonable; avoid running this every minute, as
  hammering UTD's login session repeatedly could trip rate limits or
  look like unusual activity on your account.
- This only reads your own Blackboard data — it doesn't post, submit, or
  change anything.
