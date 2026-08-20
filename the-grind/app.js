const STORAGE_KEY = "the-grind-v1";

const RANKS = [
  { min: 0, name: "Rookie" },
  { min: 100, name: "Walk-On" },
  { min: 250, name: "Starter" },
  { min: 500, name: "Captain" },
  { min: 900, name: "Legend" },
];

const ACHIEVEMENTS = {
  first_app: { title: "Paperwork Speedrun", g: 15, hint: "Log your first career mission" },
  interview: { title: "On-Site Arc", g: 40, hint: "Move a job into interview" },
  offer: { title: "Offer Incoming", g: 100, hint: "Land an offer" },
  episode: { title: "Next Episode", g: 10, hint: "Log an anime episode" },
  season: { title: "Season Complete", g: 35, hint: "Finish a series" },
  boot: { title: "Booted Up", g: 10, hint: "Add a game to the library" },
  session: { title: "One More Match", g: 10, hint: "Log an Xbox session" },
  homestand: { title: "Homestand", g: 20, hint: "Follow three teams" },
  daily: { title: "Daily Grinder", g: 50, hint: "Clear every daily challenge" },
  polymath: { title: "Four Lanes", g: 25, hint: "Touch jobs, sports, anime, and Xbox" },
};

const SCOUT_JOBS = [
  { company: "Capital One", role: "Technology Intern", location: "Plano, TX", type: "Internship" },
  { company: "American Airlines", role: "IT Intern", location: "Fort Worth, TX", type: "Internship" },
  { company: "Toyota Connected", role: "Software Intern", location: "Plano, TX", type: "Internship" },
  { company: "AT&T", role: "Technology Development Intern", location: "Dallas, TX", type: "Internship" },
  { company: "Texas Instruments", role: "IT Intern", location: "Dallas, TX", type: "Internship" },
  { company: "Fidelity Investments", role: "Technology Intern", location: "Westlake, TX", type: "Internship" },
  { company: "Southwest Airlines", role: "Technology Intern", location: "Dallas, TX", type: "Internship" },
  { company: "State Farm", role: "IT Intern", location: "Richardson, TX", type: "Internship" },
  { company: "UT Dallas OIT", role: "Student Technician", location: "Richardson, TX", type: "Campus" },
];

const SEED_ANIME = [
  {
    id: "a-onepiece",
    anilistId: 21,
    title: "ONE PIECE",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21-ELSYx3yMPcKM.jpg",
    episodes: 1100,
    progress: 1088,
    status: "watching",
    score: 87,
  },
  {
    id: "a-bluelock",
    anilistId: 137822,
    title: "BLUE LOCK",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx137822-U8naszP96vzC.png",
    episodes: 24,
    progress: 18,
    status: "watching",
    score: 80,
  },
  {
    id: "a-jjk",
    anilistId: 113415,
    title: "JUJUTSU KAISEN",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx113415-LHBAeoZDIsnF.jpg",
    episodes: 24,
    progress: 24,
    status: "watching",
    score: 84,
  },
  {
    id: "a-haikyuu",
    anilistId: 20464,
    title: "HAIKYU!!",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx20464-ooZUyBe4ptp9.png",
    episodes: 25,
    progress: 25,
    status: "done",
    score: 84,
  },
  {
    id: "a-frieren",
    anilistId: 154587,
    title: "Frieren: Beyond Journey’s End",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587-qQTzQnEJJ3oB.jpg",
    episodes: 28,
    progress: 0,
    status: "queue",
    score: 91,
  },
  {
    id: "a-kuroko",
    anilistId: 11771,
    title: "Kuroko's Basketball",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx11771-uvr44RAwRxPw.jpg",
    episodes: 25,
    progress: 0,
    status: "queue",
    score: 78,
  },
];

const SEED_GAMES = [
  { id: "g-halo", title: "Halo Infinite", genre: "Shooter", hours: 42, pct: 61, status: "playing", accent: "#9ae66e", mark: "HI" },
  { id: "g-forza", title: "Forza Horizon 5", genre: "Racing", hours: 28, pct: 47, status: "playing", accent: "#ff7a18", mark: "FH" },
  { id: "g-fc", title: "EA Sports FC 26", genre: "Sports", hours: 19, pct: 33, status: "playing", accent: "#b6ff00", mark: "FC" },
  { id: "g-mlb", title: "MLB The Show 26", genre: "Sports", hours: 11, pct: 22, status: "backlog", accent: "#6aa8ff", mark: "TB" },
  { id: "g-sea", title: "Sea of Thieves", genre: "Adventure", hours: 15, pct: 18, status: "backlog", accent: "#3ad0c8", mark: "ST" },
  { id: "g-hifi", title: "Hi-Fi Rush", genre: "Rhythm / Action", hours: 8, pct: 90, status: "done", accent: "#ff4d8d", mark: "HF" },
];

const TEAMS = [
  { id: "DAL-NFL", abbr: "DAL", name: "Cowboys", league: "NFL", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png" },
  { id: "TEX-MLB", abbr: "TEX", name: "Rangers", league: "MLB", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/tex.png" },
  { id: "DAL-NBA", abbr: "DAL", name: "Mavericks", league: "NBA", logo: "https://a.espncdn.com/i/teamlogos/nba/500/dal.png" },
  { id: "DAL-NHL", abbr: "DAL", name: "Stars", league: "NHL", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/dal.png" },
  { id: "KC-NFL", abbr: "KC", name: "Chiefs", league: "NFL", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png" },
  { id: "HOU-MLB", abbr: "HOU", name: "Astros", league: "MLB", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/hou.png" },
  { id: "UTD", abbr: "UTD", name: "Comets", league: "NCAA", logo: "" },
];

const SEED_SCORES = {
  mlb: [
    game("MLB", "TEX", "Rangers", "0", false, "WSH", "Nationals", "3", true, "Top 7th"),
    game("MLB", "HOU", "Astros", "3", false, "LAA", "Angels", "2", true, "Bot 5th"),
    game("MLB", "NYY", "Yankees", "5", true, "BAL", "Orioles", "3", false, "Final"),
    game("MLB", "LAD", "Dodgers", "4", true, "COL", "Rockies", "0", false, "Bot 4th"),
  ],
  nfl: [
    game("NFL", "DAL", "Cowboys", "17", true, "SEA", "Seahawks", "7", false, "Final"),
    game("NFL", "KC", "Chiefs", "12", false, "LAR", "Rams", "20", true, "Final"),
    game("NFL", "BUF", "Bills", "29", true, "CAR", "Panthers", "14", false, "Final"),
    game("NFL", "PHI", "Eagles", "7", false, "BAL", "Ravens", "24", true, "Final"),
  ],
  nba: [game("NBA", "MIA", "Heat", "0", false, "TOR", "Raptors", "0", false, "10/3 · 7:00 PM EDT")],
  nhl: [game("NHL", "DAL", "Stars", "0", false, "STL", "Blues", "0", false, "9/19 · 7:00 PM EDT")],
  ncaa: [game("NCAA", "UTD", "Comets", "", false, "UTA", "UT Arlington", "", false, "Campus slate")],
};

function game(league, aAbbr, aName, aScore, aWin, bAbbr, bName, bScore, bWin, status) {
  return {
    league,
    status,
    teams: [
      { abbr: aAbbr, name: aName, score: aScore, winner: aWin, home: false },
      { abbr: bAbbr, name: bName, score: bScore, winner: bWin, home: true },
    ],
  };
}

let scores = SEED_SCORES;
let state = loadState();
let animeSearchResults = [];

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function defaultState() {
  return {
    profile: {
      name: "Mayukh Tatipamula",
      handle: "mxt210047",
      school: "The University of Texas at Dallas",
      major: "Information Technology & Systems",
    },
    g: 245,
    unlocked: ["first_app", "episode", "boot", "homestand", "polymath"],
    lanes: { jobs: true, sports: true, anime: true, xbox: true },
    jobs: [
      {
        id: "j-statefarm",
        company: "State Farm",
        role: "IT Intern",
        location: "Richardson, TX",
        type: "Internship",
        status: "applied",
        notes: "15 minutes from campus. Resume sent.",
      },
      {
        id: "j-capitalone",
        company: "Capital One",
        role: "Technology Intern",
        location: "Plano, TX",
        type: "Internship",
        status: "scouting",
        notes: "Strong ITS + analytics overlap.",
      },
      {
        id: "j-aa",
        company: "American Airlines",
        role: "IT Intern",
        location: "Fort Worth, TX",
        type: "Internship",
        status: "scouting",
        notes: "Ops + systems. Watch the portal.",
      },
    ],
    anime: SEED_ANIME.map((item) => ({ ...item })),
    games: SEED_GAMES.map((item) => ({ ...item })),
    followed: ["DAL-NFL", "TEX-MLB", "DAL-NBA", "DAL-NHL", "UTD"],
    activity: [
      { at: Date.now() - 3600e3, text: "Logged episode 1088 of ONE PIECE" },
      { at: Date.now() - 7200e3, text: "Applied to State Farm IT Intern" },
      { at: Date.now() - 10800e3, text: "Cowboys preseason win vs Seahawks" },
      { at: Date.now() - 14400e3, text: "Halo Infinite session · 2 hours" },
    ],
    questDate: todayKey(),
    quests: { mission: false, sideline: false, episode: false, session: false },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (parsed.questDate !== todayKey()) {
      parsed.questDate = todayKey();
      parsed.quests = { mission: false, sideline: false, episode: false, session: false };
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function rankFor(g) {
  return [...RANKS].reverse().find((rank) => g >= rank.min) || RANKS[0];
}

function nextRank(g) {
  return RANKS.find((rank) => rank.min > g);
}

function note(text) {
  state.activity.unshift({ at: Date.now(), text });
  state.activity = state.activity.slice(0, 24);
}

function addG(amount, text) {
  state.g += amount;
  if (text) note(text);
  save();
  renderChrome();
}

function unlock(id) {
  if (state.unlocked.includes(id)) return;
  const achievement = ACHIEVEMENTS[id];
  if (!achievement) return;
  state.unlocked.push(id);
  state.g += achievement.g;
  note(`Achievement unlocked · ${achievement.title}`);
  save();
  toast(achievement);
  renderChrome();
}

function toast(achievement) {
  const root = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `
    <div class="g-orb">G</div>
    <div>
      <small>Achievement unlocked</small>
      <strong>${escapeHtml(achievement.title)}</strong>
    </div>
    <div>${achievement.g} G</div>
  `;
  root.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function markQuest(key) {
  if (!state.quests[key]) {
    state.quests[key] = true;
    addG(20, null);
  }
  const done = Object.values(state.quests).every(Boolean);
  if (done) unlock("daily");
  if (Object.values(state.lanes).every(Boolean)) unlock("polymath");
  save();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function route() {
  const hash = (location.hash || "#dashboard").slice(1);
  return ["dashboard", "jobs", "sports", "anime", "xbox"].includes(hash) ? hash : "dashboard";
}

function $(sel, el = document) {
  return el.querySelector(sel);
}

function renderChrome() {
  const rank = rankFor(state.g);
  const next = nextRank(state.g);
  const floor = rank.min;
  const ceil = next ? next.min : floor + 100;
  const pct = Math.min(100, Math.round(((state.g - floor) / (ceil - floor)) * 100));
  $("#rail-rank").innerHTML = `
    <div class="g">${state.g} <small>G</small></div>
    <div class="rank-name">${escapeHtml(rank.name)}</div>
    <div class="xp-bar" aria-label="Rank progress"><i style="width:${pct}%"></i></div>
  `;
  document.querySelectorAll(".nav a").forEach((link) => {
    link.classList.toggle("active", link.dataset.route === route());
  });
  $("#clock").textContent = new Date().toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  renderTicker();
}

function allGames() {
  return ["mlb", "nfl", "nba", "nhl", "ncaa"].flatMap((league) =>
    (scores[league] || []).map((item) => ({ ...item, league: item.league || league.toUpperCase() }))
  );
}

function renderTicker() {
  const watching = state.anime.find((show) => show.status === "watching");
  const playing = state.games.find((gameItem) => gameItem.status === "playing");
  const bits = [
    ...allGames().map((item) => {
      const [away, home] = item.teams;
      return `${item.league}: ${away.abbr} ${away.score} @ ${home.abbr} ${home.score} · ${item.status}`;
    }),
    `${state.jobs.filter((job) => job.status === "applied" || job.status === "interview").length} missions in flight`,
    watching ? `Now watching ${watching.title} · ep ${watching.progress}` : "Queue is idle",
    playing ? `Now playing ${playing.title}` : "Xbox is on the charger",
  ];
  const line = bits.map((bit, i) => `${i ? '<span class="dot">/</span>' : ""}<b>${escapeHtml(bit)}</b>`).join("");
  $("#ticker").innerHTML = `<div class="ticker-track">${line}${line}</div>`;
}

function render() {
  renderChrome();
  const view = $("#view");
  const page = route();
  const pages = { dashboard: viewDashboard, jobs: viewJobs, sports: viewSports, anime: viewAnime, xbox: viewXbox };
  view.innerHTML = pages[page]();
  bindView(page);
}

function viewDashboard() {
  const rank = rankFor(state.g);
  const openJobs = state.jobs.filter((job) => job.status !== "closed" && job.status !== "offer").length;
  const watching = state.anime.filter((show) => show.status === "watching");
  const playing = state.games.filter((gameItem) => gameItem.status === "playing");
  const quests = [
    ["mission", "Push a career mission", "Add or advance a job"],
    ["sideline", "Check the sideline", "Open scores for a followed team"],
    ["episode", "Advance the watch queue", "Log one episode"],
    ["session", "Log a session", "Add Xbox hours"],
  ];
  const featuredJob = state.jobs.find((job) => job.status === "applied") || state.jobs[0];
  const featuredShow = watching[0];
  const featuredGame = playing[0];
  const featuredScore = followedGames()[0] || allGames()[0];

  return `
    <p class="kicker">Lobby · ${escapeHtml(state.profile.handle)}</p>
    <div class="hero">
      <section class="player-card">
        <p class="kicker">Player card</p>
        <div class="name">${escapeHtml(state.profile.name)}</div>
        <div class="chips">
          <span class="chip job">${escapeHtml(state.profile.major)}</span>
          <span class="chip sport">Dallas sports</span>
          <span class="chip anime">Watch queue</span>
          <span class="chip xbox">Xbox library</span>
        </div>
        <p class="lede">${escapeHtml(state.profile.school)}. Internships, box scores, episode counts, and Game Pass — tracked like one season.</p>
        <div class="stat-row">
          <div class="stat"><b>${state.g}</b><span>Gamerscore</span></div>
          <div class="stat"><b>${escapeHtml(rank.name)}</b><span>Rank</span></div>
          <div class="stat"><b>${openJobs}</b><span>Live missions</span></div>
          <div class="stat"><b>${state.unlocked.length}</b><span>Achievements</span></div>
        </div>
      </section>
      <section class="quests">
        <p class="kicker">Daily challenges</p>
        <h2>Today's grind</h2>
        ${quests
          .map(
            ([key, title, hint]) => `
          <div class="quest ${state.quests[key] ? "done" : ""}">
            <div class="mark">${state.quests[key] ? "✓" : ""}</div>
            <div>
              <strong>${title}</strong>
              <div class="meta">${hint} · +20 G</div>
            </div>
            <span>${state.quests[key] ? "Cleared" : "Open"}</span>
          </div>`
          )
          .join("")}
      </section>
    </div>
    <div class="now-grid">
      ${nowTile("job", "Now applying", featuredJob ? featuredJob.company : "No mission pinned", featuredJob ? featuredJob.role : "Scout the board", "#jobs")}
      ${nowTile("sport", "Now on the stick", featuredScore ? `${featuredScore.teams[0].abbr} @ ${featuredScore.teams[1].abbr}` : "Off day", featuredScore ? featuredScore.status : "Check back tonight", "#sports")}
      ${nowTile("anime", "Now watching", featuredShow ? featuredShow.title : "Nothing queued", featuredShow ? `Episode ${featuredShow.progress}` : "Add a series", "#anime")}
      ${nowTile("xbox", "Now playing", featuredGame ? featuredGame.title : "Library idle", featuredGame ? `${featuredGame.hours} hrs · ${featuredGame.pct}%` : "Dock the controller", "#xbox")}
    </div>
    <div class="grid-3">
      <section class="panel" style="padding:16px">
        <p class="kicker">Feed</p>
        <h2>Recent</h2>
        <ul class="activity">
          ${state.activity
            .slice(0, 6)
            .map(
              (item) =>
                `<li><time>${new Date(item.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time><span>${escapeHtml(item.text)}</span></li>`
            )
            .join("")}
        </ul>
      </section>
      <section class="panel" style="padding:16px">
        <p class="kicker">Crossover</p>
        <h2>Why this hub</h2>
        <p class="lede">Sports anime like Haikyuu and Blue Lock sit next to Cowboys and Rangers scores. EA Sports FC and MLB The Show sit next to internship applications. Same grind, four lanes.</p>
      </section>
      <section class="panel" style="padding:16px">
        <p class="kicker">Trophy case</p>
        <h2>Unlocked</h2>
        ${state.unlocked.map((id) => `<div class="chip xbox">${escapeHtml(ACHIEVEMENTS[id].title)}</div>`).join("")}
        <div class="chips" style="margin-top:12px">
          ${Object.entries(ACHIEVEMENTS)
            .filter(([id]) => !state.unlocked.includes(id))
            .map(([, item]) => `<span class="chip">${escapeHtml(item.title)}</span>`)
            .join("")}
        </div>
      </section>
    </div>
  `;
}

function nowTile(kind, label, title, meta, href) {
  return `
    <a class="tile" href="${href}">
      <div class="label chip ${kind}">${label}</div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(meta)}</p>
      <footer>Open lane</footer>
    </a>`;
}

function viewJobs() {
  const columns = [
    ["scouting", "Scouting"],
    ["applied", "Applied"],
    ["interview", "Interview"],
    ["offer", "Offer"],
  ];
  const used = new Set(state.jobs.map((job) => `${job.company}|${job.role}`));
  const scouts = SCOUT_JOBS.filter((job) => !used.has(`${job.company}|${job.role}`));
  return `
    <div class="section-head">
      <div>
        <p class="kicker">Career missions</p>
        <h1>The board</h1>
        <p class="lede">Treat internships like raids. Pin Dallas-area ITS roles, then push them across the map.</p>
      </div>
      <div class="toolbar">
        <button class="btn" data-action="add-job">New mission</button>
      </div>
    </div>
    <div class="kanban">
      ${columns
        .map(([status, label]) => {
          const cards = state.jobs.filter((job) => job.status === status);
          return `<section class="col">
            <h3>${label} <em>${cards.length}</em></h3>
            ${cards.map(jobCard).join("") || `<div class="empty">Nothing here.</div>`}
          </section>`;
        })
        .join("")}
    </div>
    <div class="section-head"><h2>Scout list · DFW</h2></div>
    <div class="grid-3">
      ${scouts
        .map(
          (job) => `
        <article class="scout-card">
          <h4>${escapeHtml(job.company)}</h4>
          <div class="meta">${escapeHtml(job.role)} · ${escapeHtml(job.location)}</div>
          <div class="row-actions">
            <button class="icon-btn" data-scout="${escapeHtml(job.company)}|${escapeHtml(job.role)}|${escapeHtml(job.location)}|${escapeHtml(job.type)}">Pin mission</button>
          </div>
        </article>`
        )
        .join("")}
    </div>
  `;
}

function jobCard(job) {
  const next = { scouting: "applied", applied: "interview", interview: "offer", offer: "closed" };
  return `
    <article class="job-card">
      <h4>${escapeHtml(job.company)}</h4>
      <div class="meta">${escapeHtml(job.role)}</div>
      <div class="meta">${escapeHtml(job.location)} · ${escapeHtml(job.type)}</div>
      ${job.notes ? `<p class="lede">${escapeHtml(job.notes)}</p>` : ""}
      <div class="row-actions">
        ${
          next[job.status]
            ? `<button class="icon-btn" data-advance="${job.id}">Advance</button>`
            : ""
        }
        <button class="icon-btn" data-drop="${job.id}">Drop</button>
      </div>
    </article>`;
}

function followedGames() {
  const keys = new Set(
    TEAMS.filter((team) => state.followed.includes(team.id)).map((team) => `${team.league}:${team.abbr}`)
  );
  return allGames().filter((item) => item.teams.some((team) => keys.has(`${item.league}:${team.abbr}`)));
}

function viewSports() {
  const list = followedGames().length ? followedGames() : allGames();
  return `
    <div class="section-head">
      <div>
        <p class="kicker">Sideline</p>
        <h1>Box scores</h1>
        <p class="lede">Dallas first: Cowboys, Rangers, Mavs, Stars, and the Comets. Follow more clubs and refresh when a proxy is running.</p>
      </div>
      <button class="btn secondary" data-action="refresh-scores">Refresh scores</button>
    </div>
    <div class="team-picker">
      ${TEAMS.map(
        (team) => `
        <button type="button" class="${state.followed.includes(team.id) ? "on" : ""}" data-follow="${team.id}">
          ${escapeHtml(team.abbr)} ${escapeHtml(team.name)}
        </button>`
      ).join("")}
    </div>
    <div class="scoreboard">
      ${list.map(scoreCard).join("") || `<div class="empty">No games on the stick.</div>`}
    </div>
  `;
}

function scoreCard(item) {
  const [away, home] = item.teams;
  const logo = (abbr) => {
    const team =
      TEAMS.find((entry) => entry.abbr === abbr && entry.league === item.league && entry.logo) ||
      TEAMS.find((entry) => entry.abbr === abbr && entry.logo);
    return team
      ? `<img alt="" src="${team.logo}">`
      : `<div class="logo-fallback">${escapeHtml(abbr)}</div>`;
  };
  const row = (team) => `
    <div class="team-row ${team.winner ? "winner" : ""}">
      ${logo(team.abbr)}
      <div class="name">${escapeHtml(team.name)}</div>
      <div class="score">${escapeHtml(team.score || "–")}</div>
    </div>`;
  return `
    <article class="score-card">
      <div class="league">${escapeHtml(item.league)}</div>
      <div class="teams">${row(away)}${row(home)}</div>
      <div class="status">${escapeHtml(item.status)}</div>
    </article>`;
}

function viewAnime() {
  const groups = [
    ["watching", "Watching"],
    ["queue", "Queue"],
    ["done", "Completed"],
  ];
  return `
    <div class="section-head">
      <div>
        <p class="kicker">Watch queue</p>
        <h1>Next episode</h1>
        <p class="lede">Search AniList, pin a series, and grind episodes the same way you grind applications.</p>
      </div>
    </div>
    <form class="search-row" id="anime-search">
      <input type="text" name="q" placeholder="Search anime — try Blue Lock, Haikyuu, Frieren" required />
      <button class="btn" type="submit">Search</button>
    </form>
    <div id="anime-results"></div>
    ${groups
      .map(([status, label]) => {
        const items = state.anime.filter((show) => show.status === status);
        return `<div class="section-head"><h2>${label}</h2></div>
          <div class="media-grid">${items.map(animeCard).join("") || `<div class="empty">Empty shelf.</div>`}</div>`;
      })
      .join("")}
  `;
}

function animeCard(show) {
  const pct = show.episodes ? Math.min(100, Math.round((show.progress / show.episodes) * 100)) : 0;
  return `
    <article class="media-card">
      <div class="cover">${show.cover ? `<img alt="" src="${escapeHtml(show.cover)}">` : ""}</div>
      <div class="body">
        <h4>${escapeHtml(show.title)}</h4>
        <div class="meta">${show.progress}/${show.episodes || "?"} eps</div>
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="row-actions">
          ${show.status !== "done" ? `<button class="icon-btn" data-ep="${show.id}">+1 ep</button>` : ""}
          ${show.status === "queue" ? `<button class="icon-btn" data-watch="${show.id}">Start</button>` : ""}
          ${show.status === "watching" ? `<button class="icon-btn" data-finish="${show.id}">Finish</button>` : ""}
          <button class="icon-btn" data-drop-show="${show.id}">Remove</button>
        </div>
      </div>
    </article>`;
}

function viewXbox() {
  const playing = state.games.filter((gameItem) => gameItem.status === "playing");
  return `
    <div class="section-head">
      <div>
        <p class="kicker">Xbox library</p>
        <h1>Loadout</h1>
        <p class="lede">Hours, completion, and what's currently in the disc drive. Sports titles sit next to Halo on purpose.</p>
      </div>
      <button class="btn" data-action="add-game">Add game</button>
    </div>
    <div class="now-grid">
      ${playing
        .map(
          (gameItem) => `
        <article class="tile">
          <div class="label chip xbox">In session</div>
          <h3>${escapeHtml(gameItem.title)}</h3>
          <p>${gameItem.hours} hours · ${gameItem.pct}% complete</p>
          <div class="row-actions">
            <button class="icon-btn" data-hours="${gameItem.id}">Log +1 hr</button>
          </div>
        </article>`
        )
        .join("")}
    </div>
    <div class="game-grid">
      ${state.games.map(gameCard).join("")}
    </div>
  `;
}

function gameCard(gameItem) {
  return `
    <article class="game-card">
      <div class="game-cover" style="background:${gameItem.accent}22;color:${gameItem.accent}">${escapeHtml(gameItem.mark || gameItem.title.slice(0, 2).toUpperCase())}</div>
      <div class="body">
        <h4>${escapeHtml(gameItem.title)}</h4>
        <div class="meta">${escapeHtml(gameItem.genre)} · ${escapeHtml(gameItem.status)}</div>
        <div class="progress"><i style="width:${gameItem.pct}%"></i></div>
        <div class="row-actions">
          <button class="icon-btn" data-hours="${gameItem.id}">+1 hr</button>
          <button class="icon-btn" data-pct="${gameItem.id}">+5%</button>
          <button class="icon-btn" data-drop-game="${gameItem.id}">Remove</button>
        </div>
      </div>
    </article>`;
}

function bindView(page) {
  if (page === "jobs") {
    $("[data-action='add-job']")?.addEventListener("click", () => openJobModal());
    document.querySelectorAll("[data-scout]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const [company, role, location, type] = btn.dataset.scout.split("|");
        addJob({ company, role, location, type, status: "scouting", notes: "Pinned from the DFW scout list." });
      })
    );
    document.querySelectorAll("[data-advance]").forEach((btn) =>
      btn.addEventListener("click", () => advanceJob(btn.dataset.advance))
    );
    document.querySelectorAll("[data-drop]").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.jobs = state.jobs.filter((job) => job.id !== btn.dataset.drop);
        save();
        render();
      })
    );
  }
  if (page === "sports") {
    markQuest("sideline");
    state.lanes.sports = true;
    save();
    $("[data-action='refresh-scores']")?.addEventListener("click", () => loadScores(true).then(render));
    document.querySelectorAll("[data-follow]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const id = btn.dataset.follow;
        if (state.followed.includes(id)) state.followed = state.followed.filter((item) => item !== id);
        else state.followed.push(id);
        if (state.followed.length >= 3) unlock("homestand");
        save();
        render();
      })
    );
  }
  if (page === "anime") {
    $("#anime-search")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const q = new FormData(event.target).get("q");
      animeSearchResults = await searchAnime(String(q || "").trim());
      $("#anime-results").innerHTML = animeSearchResults.length
        ? `<div class="search-results">${animeSearchResults
            .map(
              (item) => `
            <article class="scout-card">
              <h4>${escapeHtml(item.title)}</h4>
              <div class="meta">${item.episodes || "?"} eps · score ${item.score || "—"}</div>
              <button class="icon-btn" data-add-anime="${item.anilistId}">Add to queue</button>
            </article>`
            )
            .join("")}</div>`
        : `<div class="empty">No hits. AniList may be unreachable — pin a title from the shelves instead.</div>`;
      document.querySelectorAll("[data-add-anime]").forEach((btn) =>
        btn.addEventListener("click", () => {
          const item = animeSearchResults.find((entry) => String(entry.anilistId) === btn.dataset.addAnime);
          if (item) addAnime(item);
        })
      );
    });
    document.querySelectorAll("[data-ep]").forEach((btn) => btn.addEventListener("click", () => bumpEpisode(btn.dataset.ep)));
    document.querySelectorAll("[data-watch]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const show = state.anime.find((item) => item.id === btn.dataset.watch);
        if (show) show.status = "watching";
        save();
        render();
      })
    );
    document.querySelectorAll("[data-finish]").forEach((btn) =>
      btn.addEventListener("click", () => finishAnime(btn.dataset.finish))
    );
    document.querySelectorAll("[data-drop-show]").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.anime = state.anime.filter((item) => item.id !== btn.dataset.dropShow);
        save();
        render();
      })
    );
  }
  if (page === "xbox") {
    $("[data-action='add-game']")?.addEventListener("click", () => openGameModal());
    document.querySelectorAll("[data-hours]").forEach((btn) => btn.addEventListener("click", () => logHours(btn.dataset.hours)));
    document.querySelectorAll("[data-pct]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const gameItem = state.games.find((item) => item.id === btn.dataset.pct);
        if (!gameItem) return;
        gameItem.pct = Math.min(100, gameItem.pct + 5);
        if (gameItem.pct === 100) gameItem.status = "done";
        addG(5, `${gameItem.title} completion ${gameItem.pct}%`);
        render();
      })
    );
    document.querySelectorAll("[data-drop-game]").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.games = state.games.filter((item) => item.id !== btn.dataset.dropGame);
        save();
        render();
      })
    );
  }
}

function addJob(job) {
  state.jobs.unshift({ id: uid("job"), notes: "", ...job });
  state.lanes.jobs = true;
  addG(10, `Pinned ${job.company} · ${job.role}`);
  unlock("first_app");
  markQuest("mission");
  render();
}

function advanceJob(id) {
  const job = state.jobs.find((item) => item.id === id);
  if (!job) return;
  const next = { scouting: "applied", applied: "interview", interview: "offer", offer: "closed" };
  job.status = next[job.status] || job.status;
  const bonus = { applied: 25, interview: 50, offer: 100, closed: 5 }[job.status] || 10;
  addG(bonus, `${job.company} moved to ${job.status}`);
  if (job.status === "interview") unlock("interview");
  if (job.status === "offer") unlock("offer");
  markQuest("mission");
  state.lanes.jobs = true;
  render();
}

function addAnime(item) {
  if (state.anime.some((show) => show.anilistId === item.anilistId)) return;
  state.anime.unshift({
    id: uid("ani"),
    anilistId: item.anilistId,
    title: item.title,
    cover: item.cover,
    episodes: item.episodes || 0,
    progress: 0,
    status: "queue",
    score: item.score || null,
  });
  state.lanes.anime = true;
  addG(10, `Queued ${item.title}`);
  render();
}

function bumpEpisode(id) {
  const show = state.anime.find((item) => item.id === id);
  if (!show) return;
  show.status = "watching";
  show.progress += 1;
  if (show.episodes && show.progress >= show.episodes) {
    show.progress = show.episodes;
    finishAnime(id);
    return;
  }
  addG(5, `Logged ${show.title} episode ${show.progress}`);
  unlock("episode");
  markQuest("episode");
  state.lanes.anime = true;
  render();
}

function finishAnime(id) {
  const show = state.anime.find((item) => item.id === id);
  if (!show) return;
  show.status = "done";
  if (show.episodes) show.progress = show.episodes;
  addG(40, `Finished ${show.title}`);
  unlock("season");
  markQuest("episode");
  render();
}

function logHours(id) {
  const gameItem = state.games.find((item) => item.id === id);
  if (!gameItem) return;
  gameItem.hours += 1;
  gameItem.status = "playing";
  addG(8, `${gameItem.title} session · ${gameItem.hours} hrs`);
  unlock("session");
  markQuest("session");
  state.lanes.xbox = true;
  render();
}

function openJobModal() {
  openModal(
    "New career mission",
    `
    <form class="form" id="job-form">
      <input name="company" required placeholder="Company" />
      <input name="role" required placeholder="Role" />
      <div class="form-row">
        <input name="location" placeholder="Location" />
        <select name="type">
          <option>Internship</option>
          <option>Full-time</option>
          <option>Campus</option>
        </select>
      </div>
      <textarea name="notes" rows="3" placeholder="Notes"></textarea>
      <button class="btn" type="submit">Pin mission</button>
    </form>
  `,
    (root) => {
      $("#job-form", root).addEventListener("submit", (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.target).entries());
        closeModal();
        addJob({ ...data, status: "scouting" });
      });
    }
  );
}

function openGameModal() {
  openModal(
    "Add to library",
    `
    <form class="form" id="game-form">
      <input name="title" required placeholder="Game title" />
      <div class="form-row">
        <input name="genre" placeholder="Genre" />
        <input name="mark" maxlength="2" placeholder="Mark (e.g. HI)" />
      </div>
      <button class="btn" type="submit">Add game</button>
    </form>
  `,
    (root) => {
      $("#game-form", root).addEventListener("submit", (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.target).entries());
        state.games.unshift({
          id: uid("game"),
          title: data.title,
          genre: data.genre || "Xbox",
          hours: 0,
          pct: 0,
          status: "backlog",
          accent: "#b6ff00",
          mark: (data.mark || data.title).slice(0, 2).toUpperCase(),
        });
        closeModal();
        addG(10, `Added ${data.title} to the library`);
        unlock("boot");
        state.lanes.xbox = true;
        render();
      });
    }
  );
}

function openModal(title, body, bind) {
  const root = $("#modal-root");
  root.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal">
        <div class="section-head">
          <h2>${escapeHtml(title)}</h2>
          <button class="ghost-btn" data-close>Close</button>
        </div>
        ${body}
      </div>
    </div>`;
  $("[data-close]", root).addEventListener("click", closeModal);
  $(".modal-backdrop", root).addEventListener("click", (event) => {
    if (event.target.classList.contains("modal-backdrop")) closeModal();
  });
  bind(root);
}

function closeModal() {
  $("#modal-root").innerHTML = "";
}

async function searchAnime(q) {
  if (!q) return [];
  try {
    const query = `query ($q: String) {
      Page(page: 1, perPage: 8) {
        media(search: $q, type: ANIME, sort: SEARCH_MATCH) {
          id title { romaji english } coverImage { large } episodes averageScore
        }
      }
    }`;
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables: { q } }),
    });
    const json = await response.json();
    return (json.data?.Page?.media || []).map((item) => ({
      anilistId: item.id,
      title: item.title.english || item.title.romaji,
      cover: item.coverImage?.large,
      episodes: item.episodes,
      score: item.averageScore,
    }));
  } catch {
    return [];
  }
}

function compactEspn(payload, league) {
  return (payload.events || []).map((event) => {
    const competition = event.competitions?.[0] || {};
    const status = competition.status?.type || {};
    const teams = (competition.competitors || []).map((competitor) => ({
      abbr: competitor.team?.abbreviation,
      name: competitor.team?.shortDisplayName || competitor.team?.displayName,
      score: competitor.score,
      winner: Boolean(competitor.winner),
      home: competitor.homeAway === "home",
    }));
    teams.sort((a, b) => Number(a.home) - Number(b.home));
    return { league, status: status.shortDetail || status.description || "", teams };
  });
}

async function loadScores(force) {
  try {
    const response = await fetch("/api/scores", { cache: force ? "reload" : "default" });
    if (!response.ok) throw new Error("proxy missing");
    const payload = await response.json();
    scores = {
      mlb: compactEspn(payload.mlb || {}, "MLB"),
      nfl: compactEspn(payload.nfl || {}, "NFL"),
      nba: compactEspn(payload.nba || {}, "NBA"),
      nhl: compactEspn(payload.nhl || {}, "NHL"),
      ncaa: SEED_SCORES.ncaa,
    };
  } catch {
    scores = SEED_SCORES;
  }
}

function init() {
  $("#reset-demo").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    save();
    render();
  });
  window.addEventListener("hashchange", render);
  document.addEventListener("keydown", (event) => {
    const map = { 1: "dashboard", 2: "jobs", 3: "sports", 4: "anime", 5: "xbox" };
    if (map[event.key] && !event.metaKey && !event.ctrlKey && !["INPUT", "TEXTAREA"].includes(event.target.tagName)) {
      location.hash = map[event.key];
    }
  });
  setInterval(() => {
    $("#clock").textContent = new Date().toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, 30000);
  loadScores().finally(render);
}

init();
