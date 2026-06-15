"""
Check UTD Blackboard To Do activity stream and email new due-soon items.

Reuses the session saved by setup_session.py (auth_state.json). Tracks
already-notified items in seen_assignments.json so your dad only gets
emails when something new shows up.
"""

import asyncio
import hashlib
import json
import os
import re
import smtplib
import sys
from datetime import date, datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from dotenv import load_dotenv
from playwright.async_api import async_playwright

load_dotenv(override=True)

BLACKBOARD_URL = "https://elearning.utdallas.edu"
ACTIVITY_STREAM_URL = f"{BLACKBOARD_URL}/ultra/stream"
INSTITUTION_PAGE_URL = f"{BLACKBOARD_URL}/ultra/institution-page"
CALENDAR_API_URL = f"{BLACKBOARD_URL}/learn/api/public/v1/calendars/items"
STATE_FILE = "auth_state.json"
SEEN_FILE = "seen_assignments.json"
DEBUG_DUMP_FILE = "debug_page_text.txt"

DUE_LINE = re.compile(
    r"^Due\s+"
    r"(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
    r"Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
    r"\s+(\d{1,2})",
    re.IGNORECASE,
)

# UTD Ultra activity stream: "Due Date: 6/15/26, 11:59 PM (CDT)"
DUE_DATE_NUMERIC = re.compile(
    r"Due\s+Date:\s*(\d{1,2})/(\d{1,2})/(\d{2,4})",
    re.IGNORECASE,
)

STREAM_TIMESTAMP = re.compile(
    r"^(\d{1,2}:\d{2}\s*(?:AM|PM)|"
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})$",
    re.IGNORECASE,
)

SKIP_LINES = frozenset(
    {
        "to do",
        "activity stream",
        "due dates",
        "today",
        "upcoming",
        "recent",
        "show all",
        "filter",
        "notification settings",
        "show more upcoming activity",
    }
)

MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}


def normalize_title(title: str) -> str:
    title = title.strip()
    if title.lower().startswith("due:"):
        title = title[4:].strip()
    return title


def expand_two_digit_year(raw: str, today: date) -> int:
    year = int(raw)
    if year >= 100:
        return year
    century = today.year // 100 * 100
    full = century + year
    if full < today.year - 1:
        full += 100
    return full


def parse_due_date(due_line: str, today: date) -> date | None:
    """Extract a calendar date from due text in several Blackboard formats."""
    text = due_line.strip()

    numeric = DUE_DATE_NUMERIC.search(text)
    if numeric:
        month, day = int(numeric.group(1)), int(numeric.group(2))
        year = expand_two_digit_year(numeric.group(3), today)
        try:
            return date(year, month, day)
        except ValueError:
            return None

    match = DUE_LINE.search(text)
    if not match:
        return None

    month = MONTHS[match.group(1).lower()]
    day = int(match.group(2))

    year = today.year
    try:
        due = date(year, month, day)
    except ValueError:
        return None

    if due < today - timedelta(days=180):
        due = date(year + 1, month, day)

    return due


def is_noise_line(line: str) -> bool:
    line = line.strip()
    if not line:
        return True
    if line.lower() in SKIP_LINES:
        return True
    return bool(STREAM_TIMESTAMP.match(line))



def parse_items_from_text(text: str) -> list[dict]:
    """
    Fallback: walk page text line-by-line.

    UTD Ultra activity stream items look like:

        <posted date>
        <posted time>
        <course name>
        Due: <assignment title>
        Due Date: 6/15/26, 11:59 PM (CDT)
    """
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    items = []

    for i, line in enumerate(lines):
        if not (DUE_DATE_NUMERIC.search(line) or DUE_LINE.match(line)):
            continue

        title_idx = i - 1
        while title_idx >= 0 and is_noise_line(lines[title_idx]):
            title_idx -= 1
        if title_idx < 0:
            continue
        title = lines[title_idx]

        course_idx = title_idx - 1
        while course_idx >= 0 and is_noise_line(lines[course_idx]):
            course_idx -= 1
        if course_idx < 0:
            continue
        course = lines[course_idx]

        due_text = line
        due_date = parse_due_date(due_text, date.today())
        items.append(
            {
                "course": course,
                "title": normalize_title(title),
                "due_text": due_text,
                "due_date": due_date,
            }
        )

    return items


async def fetch_stream_items_from_dom(page) -> list[dict]:
    """Parse Upcoming/Today cards from the Ultra activity stream DOM."""
    await page.goto(ACTIVITY_STREAM_URL, wait_until="domcontentloaded")
    await page.wait_for_timeout(5000)

    if not await session_is_valid(page):
        print("Session expired or not logged in. Re-run setup_session.py.")
        raise SystemExit(1)

    try:
        await page.wait_for_selector(
            ".js-upcomingStreamEntries .stream-item-container, "
            ".js-todayStreamEntries .stream-item-container",
            timeout=15000,
        )
    except Exception:
        pass

    cards = page.locator(
        ".js-upcomingStreamEntries .stream-item-container, "
        ".js-todayStreamEntries .stream-item-container"
    )
    count = await cards.count()
    items = []
    today = date.today()

    for i in range(count):
        card = cards.nth(i)
        course_loc = card.locator(".context a").first
        title_loc = card.locator(".name .js-title-link").first
        due_loc = card.locator(".content .due-date").first

        if await course_loc.count() == 0 or await title_loc.count() == 0:
            continue

        course = (await course_loc.inner_text()).strip()
        title = normalize_title(await title_loc.inner_text())
        due_text = (await due_loc.inner_text()).strip() if await due_loc.count() else ""

        source_id = None
        details = card.locator(".element-details").first
        if await details.count():
            ctx_raw = await details.get_attribute("analytics-context")
            if ctx_raw:
                try:
                    ctx = json.loads(ctx_raw.replace("&quot;", '"'))
                    source_id = ctx.get("id")
                except json.JSONDecodeError:
                    pass

        item = {
            "course": course,
            "title": title,
            "due_text": due_text or "Due date unknown",
            "due_date": parse_due_date(due_text, today) if due_text else None,
        }
        if source_id:
            item["source_id"] = source_id
        items.append(item)

    return items


def parse_iso_due(raw: str | None) -> date | None:
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return dt.date()
    except ValueError:
        return None


def format_due_text(iso_end: str) -> str:
    try:
        dt = datetime.fromisoformat(iso_end.replace("Z", "+00:00"))
        local = dt.astimezone()
        return f"Due {local.strftime('%b %d, %I:%M %p')}"
    except ValueError:
        return f"Due {iso_end}"


def parse_items_from_calendar(payload: dict) -> list[dict]:
    """Parse GradebookColumn entries from Blackboard's calendar API."""
    items = []
    for row in payload.get("results", []):
        if row.get("type") != "GradebookColumn":
            continue

        end = row.get("end") or row.get("start")
        if not end:
            continue

        items.append(
            {
                "course": row.get("calendarName") or "Unknown course",
                "title": normalize_title(row.get("title") or "Untitled"),
                "due_text": format_due_text(end),
                "due_date": parse_iso_due(end),
                "source_id": row.get("id"),
            }
        )

    return items


def item_key(item: dict) -> str:
    if item.get("source_id"):
        return hashlib.sha256(str(item["source_id"]).encode()).hexdigest()[:16]
    raw = f"{item['course']}|{item['title']}|{item['due_text']}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def load_seen() -> set[str]:
    path = Path(SEEN_FILE)
    if not path.exists():
        return set()
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    return set(data.get("seen", []))


def save_seen(seen: set[str]) -> None:
    with Path(SEEN_FILE).open("w", encoding="utf-8") as f:
        json.dump({"seen": sorted(seen)}, f, indent=2)


def send_email(items: list[dict]) -> None:
    email_to = os.environ["EMAIL_TO"]
    email_from = os.environ["EMAIL_FROM"]
    email_password = os.environ["EMAIL_PASSWORD"]

    subject = f"Blackboard: {len(items)} new due-soon item(s)"
    body_lines = ["New assignments due within the next week:\n"]

    for item in items:
        body_lines.append(f"Course: {item['course']}")
        body_lines.append(f"Title:  {item['title']}")
        body_lines.append(f"Due:    {item['due_text']}")
        body_lines.append("")

    body = "\n".join(body_lines)

    msg = MIMEMultipart()
    msg["From"] = email_from
    msg["To"] = email_to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(email_from, email_password)
        server.sendmail(email_from, [email_to], msg.as_string())

    print(f"Emailed {len(items)} item(s) to {email_to}")


def require_env() -> int:
    missing = [k for k in ("EMAIL_TO", "EMAIL_FROM", "EMAIL_PASSWORD") if not os.getenv(k)]
    if missing:
        print(f"Missing required env vars: {', '.join(missing)}")
        print("Copy .env.example to .env and fill in your values.")
        raise SystemExit(1)

    return int(os.getenv("DAYS_AHEAD", "7"))


def calendar_window(today: date, cutoff: date) -> tuple[str, str]:
    since = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    until = datetime.combine(cutoff, datetime.max.time().replace(microsecond=0), tzinfo=timezone.utc)
    return (
        since.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        until.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    )


async def session_is_valid(page) -> bool:
    url = page.url.lower()
    return "login" not in url and "sso" not in url


async def fetch_calendar_items(context, today: date, cutoff: date) -> list[dict]:
    since, until = calendar_window(today, cutoff)
    params = {
        "since": since,
        "until": until,
        "type": "GradebookColumn",
    }

    response = await context.request.get(CALENDAR_API_URL, params=params)
    if not response.ok:
        print(f"Calendar API returned {response.status}; falling back to page text.")
        return []

    payload = await response.json()
    return parse_items_from_calendar(payload)


async def fetch_page_text(page, url: str) -> str:
    await page.goto(url, wait_until="domcontentloaded")
    await page.wait_for_timeout(5000)

    if not await session_is_valid(page):
        print("Session expired or not logged in. Re-run setup_session.py.")
        raise SystemExit(1)

    return await page.inner_text("body")


async def fetch_assignments(today: date, cutoff: date, debug: bool) -> list[dict]:
    if not Path(STATE_FILE).exists():
        print(f"No {STATE_FILE} found. Run setup_session.py first.")
        raise SystemExit(1)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(storage_state=STATE_FILE)
        page = await context.new_page()

        # Warm up session on the home page (same origin as the API).
        await page.goto(f"{BLACKBOARD_URL}/ultra/institution-page", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)

        if not await session_is_valid(page):
            await browser.close()
            print("Session expired or not logged in. Re-run setup_session.py.")
            raise SystemExit(1)

        items = await fetch_calendar_items(context, today, cutoff)
        source = "calendar API"

        if not items:
            items = await fetch_stream_items_from_dom(page)
            source = "activity stream DOM"

        if not items:
            stream_text = await fetch_page_text(page, ACTIVITY_STREAM_URL)
            institution_text = await fetch_page_text(page, INSTITUTION_PAGE_URL)
            combined = stream_text + "\n\n--- institution page ---\n\n" + institution_text
            items = parse_items_from_text(combined)
            source = "page text (activity stream + institution page)"

            if debug:
                Path(DEBUG_DUMP_FILE).write_text(combined, encoding="utf-8")
                print(f"Wrote debug text dump to {DEBUG_DUMP_FILE}")

        await browser.close()
        print(f"Loaded {len(items)} item(s) via {source}.")
        return items


def filter_due_soon(items: list[dict], today: date, cutoff: date) -> list[dict]:
    due_soon = []
    for item in items:
        due = item.get("due_date")
        if due is None and "due_text" in item:
            due = parse_due_date(item["due_text"], today)
        if due is None:
            continue
        if today <= due <= cutoff:
            item["due_date"] = due.isoformat()
            due_soon.append(item)
    return due_soon


async def main() -> None:
    debug = "--debug" in sys.argv or os.getenv("DEBUG", "").lower() in ("1", "true", "yes")
    days_ahead = require_env()
    today = date.today()
    cutoff = today + timedelta(days=days_ahead)

    print(f"Checking Blackboard To Do (due within {days_ahead} days)...")

    all_items = await fetch_assignments(today, cutoff, debug)
    due_soon = filter_due_soon(all_items, today, cutoff)

    seen = load_seen()
    new_items = [item for item in due_soon if item_key(item) not in seen]

    print(f"Found {len(all_items)} total, {len(due_soon)} due soon, {len(new_items)} new.")

    if not new_items:
        print("Nothing new to email.")
        return

    send_email(new_items)

    for item in new_items:
        seen.add(item_key(item))
    save_seen(seen)


if __name__ == "__main__":
    asyncio.run(main())
