/* Anime Pakistan — Live AnimeSalt API + overrides */
const API_BASE = "https://animesalt-api-lovat.vercel.app";

const STORAGE = {
  manual: "ap-manual-catalog",
  hidden: "ap-hidden-ids",
  epOverride: "ap-ep-overrides",
  catOverride: "ap-cat-overrides",
  langOverride: "ap-lang-overrides",
  adminPwd: "ap-admin-pwd"
};

/* Audio language priority: site auto-plays Hindi first when available */
const LANG_PRIORITY = ["Hindi", "Urdu", "English", "Japanese"];
const DEFAULT_AUDIO_LANGS = ["Hindi", "Urdu", "Japanese"];

function pickPreferredServerKey(langs, servers) {
  langs = langs || {};
  servers = servers || {};
  for (var i = 0; i < LANG_PRIORITY.length; i++) {
    var want = LANG_PRIORITY[i];
    var keys = ["s1", "s2", "s3"];
    for (var j = 0; j < keys.length; j++) {
      var k = keys[j];
      if (langs[k] === want && servers[k]) return k;
    }
  }
  return null;
}

async function apiFetch(path) {
  try {
    const res = await fetch(API_BASE + path);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    console.error("API error:", path, err);
    return null;
  }
}

async function fetchHome() {
  try { await loadPublicOverrides(); } catch (e) {}
  const json = await apiFetch("/api/home");
  if (!json || !json.success || !json.data) return null;
  return json.data;
}

async function fetchSearch(q) {
  if (!q || !q.trim()) return [];
  const json = await apiFetch("/api/search?q=" + encodeURIComponent(q.trim()));
  if (!json || !json.success) return [];
  return (json.results || []).map(normalizeItem);
}

/** short.icu (and similar link-shorteners) redirect in a way that breaks inside an <iframe> —
 *  never auto-select them as the default player, only as a manual fallback button. */
function isSafeEmbedLink(url) {
  if (!url || typeof url !== "string") return false;
  var bad = ["short.icu"];
  for (var i = 0; i < bad.length; i++) {
    if (url.indexOf(bad[i]) !== -1) return false;
  }
  return true;
}

function pickMoviePlayers(players) {
  if (!players || !players.length) return null;
  var main = null;
  var multiPage = null;
  var langs = [];
  for (var i = 0; i < players.length; i++) {
    var p = players[i];
    if (typeof p !== "string") continue;
    if ((p.indexOf("as-cdn") !== -1 || p.indexOf("/video/") !== -1) && isSafeEmbedLink(p)) {
      if (!main) main = p;
    }
    if (p.indexOf("multi-lang-plyr") !== -1) {
      multiPage = p;
      try {
        var dataParam = p.split("data=")[1];
        var decoded = JSON.parse(atob(decodeURIComponent(dataParam)));
        if (Array.isArray(decoded)) langs = decoded;
      } catch (e) {}
    }
  }
  if (!main && players[0] && isSafeEmbedLink(players[0])) main = players[0];
  if (!main) {
    // last resort: first safe-looking link among all players
    var safeFallback = players.find(function (p) { return typeof p === "string" && isSafeEmbedLink(p); });
    if (safeFallback) main = safeFallback;
  }
  // Prefer a Hindi-tagged track if the multi-lang list gives us one — but only if it's a safe embeddable link
  var preferredLink = null, preferredLang = null;
  if (langs && langs.length) {
    for (var li = 0; li < LANG_PRIORITY.length; li++) {
      var hit = langs.find(function (l) {
        return l && typeof l.language === "string" && l.language.toLowerCase().indexOf(LANG_PRIORITY[li].toLowerCase()) !== -1 && l.link && isSafeEmbedLink(l.link);
      });
      if (hit) { preferredLink = hit.link; preferredLang = LANG_PRIORITY[li]; break; }
    }
  }
  if (preferredLink) main = preferredLink;
  return { main: main, multiPage: multiPage, langs: langs, all: players, preferredLang: preferredLang };
}

async function fetchAnime(slug) {
  const json = await apiFetch("/api/anime/" + encodeURIComponent(slug));
  if (!json || !json.success || !json.data) return null;
  const d = json.data;
  const isMovie = !!d.is_movie;
  var movieStream = null;
  var movieLangs = [];
  if (isMovie && d.movie_players) {
    movieStream = pickMoviePlayers(d.movie_players);
    if (movieStream && movieStream.langs) movieLangs = movieStream.langs;
  }
  return {
    id: slug,
    title: d.title || slug,
    description: d.description || "",
    genres: d.genres || [],
    poster: d.thumbnail || "",
    isMovie: isMovie,
    type: isMovie ? "MOVIE" : "SERIES",
    episodes: (d.episodes || []).map(function (e) {
      return {
        id: e.id,
        number: e.number,
        title: e.title || "Episode " + e.number,
        season: e.season || "1",
        thumbnail: e.thumbnail || "",
        url: e.url || ""
      };
    }),
    moviePlayers: d.movie_players || [],
    movieStream: movieStream,
    movieLangs: movieLangs
  };
}

async function fetchEpisode(episodeId) {
  // Ensure public overrides loaded (for all visitors)
  try { await loadPublicOverrides(); } catch (e) {}

  // Custom override first (multi-server) — Server 1 = API, Server 2 = your links
  var overrides = getEpOverrides();
  if (overrides[episodeId]) {
    var ov = overrides[episodeId];
    var servers = Object.assign({ s1: "", s2: "", s3: "" }, ov.servers || {});
    // Your custom link ALWAYS goes to Server 2; Server 1 stays original API
    if (servers.s1 && !servers.s2) {
      servers.s2 = servers.s1;
      servers.s1 = "";
    }
    if (!servers.s2 && ov.stream) {
      servers.s2 = ov.stream;
    }
    var nextId = ov.nextId || null;
    var prevId = ov.prevId || null;
    var apiPlayer = null;
    try {
      var live = await fetch(API + "/api/episode/" + encodeURIComponent(episodeId)).then(function (r) { return r.json(); });
      var liveData = live && (live.data || live);
      if (liveData) {
        apiPlayer = liveData.video_player || liveData.videoPlayer || liveData.player || null;
        if (!nextId) nextId = liveData.next_episode_id || liveData.nextId || null;
        if (!prevId) prevId = liveData.prev_episode_id || liveData.prevId || null;
      }
    } catch (e) {}
    // Auto next/prev from id pattern
    if (!nextId || !prevId) {
      var m = String(episodeId).match(/^(.*)-(\d+)x(\d+)$/);
      if (m) {
        var base = m[1], season = parseInt(m[2], 10), num = parseInt(m[3], 10);
        if (!prevId && num > 1) prevId = base + "-" + season + "x" + (num - 1);
        if (!nextId) nextId = base + "-" + season + "x" + (num + 1);
      }
    }
    // FORCE: Server 1 = live API, Server 2 = your override link
    if (apiPlayer) servers.s1 = apiPlayer;
    var langs = ov.langs || {};
    var preferredKey = pickPreferredServerKey(langs, servers);
    var primary = (preferredKey && servers[preferredKey]) || servers.s1 || servers.s2 || ov.stream || null;
    var availableLangs = [];
    ["s1", "s2", "s3"].forEach(function (k) {
      if (servers[k] && langs[k] && availableLangs.indexOf(langs[k]) === -1) availableLangs.push(langs[k]);
    });
    return {
      videoPlayer: primary,
      m3u8: null,
      source: "custom",
      nextId: nextId,
      prevId: prevId,
      custom: true,
      servers: servers,
      langs: langs,
      preferredKey: preferredKey,
      availableLangs: availableLangs
    };
  }
  // Manual series episode id format: manual:{seriesId}:{season}:{index}
  if (String(episodeId).indexOf("manual:") === 0) {
    var parts = episodeId.split(":");
    var sid = parts[1], season = parts[2], idx = parseInt(parts[3], 10);
    var m = getManualCatalog().find(function (x) { return x.id === sid; });
    if (m && m.seasons && m.seasons[season] && m.seasons[season][idx]) {
      var ep = m.seasons[season][idx];
      var srv = ep.servers || {};
      var epLangs = ep.langs || {};
      var prefKey = pickPreferredServerKey(epLangs, srv);
      var availLangs = [];
      ["s1", "s2", "s3"].forEach(function (k) {
        if (srv[k] && epLangs[k] && availLangs.indexOf(epLangs[k]) === -1) availLangs.push(epLangs[k]);
      });
      return {
        videoPlayer: (prefKey && srv[prefKey]) || srv.s1 || srv.s2 || srv.s3 || null,
        m3u8: null,
        source: "manual",
        nextId: null,
        prevId: null,
        custom: true,
        servers: srv,
        langs: epLangs,
        preferredKey: prefKey,
        availableLangs: availLangs
      };
    }
  }
  const json = await apiFetch("/api/episode/" + encodeURIComponent(episodeId));
  if (!json || !json.success || !json.data) return null;
  const d = json.data;
  return {
    videoPlayer: d.video_player || null,
    m3u8: d.m3u8_link || null,
    source: d.source || null,
    nextId: d.next_episode_id || null,
    prevId: d.prev_episode_id || null,
    servers: null
  };
}

/** Build episode list from manual series seasons */
function manualEpisodes(series) {
  if (!series || !series.seasons) return [];
  var out = [];
  Object.keys(series.seasons).sort(function (a, b) { return +a - +b; }).forEach(function (s) {
    (series.seasons[s] || []).forEach(function (ep, idx) {
      out.push({
        id: "manual:" + series.id + ":" + s + ":" + idx,
        number: ep.number,
        title: ep.title || ("Episode " + ep.number),
        season: s,
        thumbnail: ep.thumbnail || series.poster || "",
        servers: ep.servers || {}
      });
    });
  });
  return out;
}

function normalizeItem(item) {
  const slug = item.slug || (item.url || "").split("/").filter(Boolean).pop() || "";
  const u = item.url || "";
  const isMovie = u.indexOf("/movies/") !== -1 || u.indexOf("/movie/") !== -1;
  var cat = null;
  var cats = getCatOverrides();
  if (cats[slug]) cat = cats[slug];
  return {
    id: slug,
    title: item.title || "Unknown",
    type: isMovie ? "MOVIE" : "SERIES",
    poster: item.image || item.thumbnail || "",
    url: u,
    langs: ["English"],
    category: cat || null
  };
}

function mapHomeSections(data) {
  if (!data) return {};
  const map = {
    fresh_drops: { key: "trending", title: "Fresh Drops / Trending" },
    "on-air_series_view_more": { key: "onAir", title: "On-Air Series" },
    new_anime_arrivals_view_more: { key: "newAnime", title: "New Anime Arrivals" },
    "just_in:_cartoon_series_view_more": { key: "cartoons", title: "Cartoon Series" },
    latest_anime_movies_view_more: { key: "movies", title: "Latest Anime Movies" },
    fresh_cartoon_films_view_more: { key: "cartoonMovies", title: "Cartoon Movies" }
  };
  const out = {};
  for (const apiKey in map) {
    const meta = map[apiKey];
    const list = data[apiKey];
    if (Array.isArray(list) && list.length) {
      out[meta.key] = { title: meta.title, items: list.map(normalizeItem) };
    }
  }
  return out;
}

function getLocalManualCatalogOnly() {
  try { return JSON.parse(localStorage.getItem(STORAGE.manual) || "[]"); } catch (e) { return []; }
}
function saveManualCatalog(list) {
  localStorage.setItem(STORAGE.manual, JSON.stringify(list));
}

function getHiddenIds() {
  /* Admin ne agar local list save ki ho to wahi use (Show/Hide edits).
     Warna public-data.json ki hidden list (site visitors). */
  var raw = localStorage.getItem(STORAGE.hidden);
  if (raw !== null) {
    try { return JSON.parse(raw || "[]"); } catch (e) { return []; }
  }
  return Array.isArray(_publicHidden) ? _publicHidden.slice() : [];
}
function saveHiddenIds(arr) {
  localStorage.setItem(STORAGE.hidden, JSON.stringify(arr || []));
}
function isHidden(id) {
  return getHiddenIds().indexOf(id) !== -1;
}

var _publicOverrides = null;
var _publicManual = null;
var _publicRemoved = null;
var _publicHidden = null;
var _publicOverridesPromise = null;

function loadPublicOverrides() {
  if (_publicOverridesPromise) return _publicOverridesPromise;
  _publicOverridesPromise = Promise.all([
    fetch("overrides.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
    fetch("data/overrides.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
    fetch("public-data.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
    fetch("manual-catalog.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
  ]).then(function (arr) {
    var merged = {};
    var o0 = arr[0], o1 = arr[1];
    if (o0 && typeof o0 === "object" && !Array.isArray(o0) && !o0.overrides && !o0.manual) Object.assign(merged, o0);
    if (o1 && typeof o1 === "object" && !Array.isArray(o1) && !o1.overrides && !o1.manual) Object.assign(merged, o1);
    var pd = arr[2];
    if (pd && typeof pd === "object") {
      if (pd.overrides) Object.assign(merged, pd.overrides);
      if (Array.isArray(pd.manual)) _publicManual = pd.manual;
      if (Array.isArray(pd.removedOverrides)) _publicRemoved = pd.removedOverrides;
      if (Array.isArray(pd.hidden)) _publicHidden = pd.hidden;
      if (pd.langOverrides && typeof pd.langOverrides === "object") _publicLangOverrides = pd.langOverrides;
    }
    if (arr[3]) {
      if (Array.isArray(arr[3])) _publicManual = (_publicManual || []).concat(arr[3]);
      else if (arr[3].manual) _publicManual = (_publicManual || []).concat(arr[3].manual);
    }
    _publicOverrides = merged;
    return merged;
  });
  return _publicOverridesPromise;
}

function getRemovedOverrideIds() {
  var local = [];
  try { local = JSON.parse(localStorage.getItem("ap-ep-removed") || "[]"); } catch (e) { local = []; }
  var set = {};
  local.concat(_publicRemoved || []).forEach(function (id) { set[id] = true; });
  return set;
}

function addRemovedOverrideId(id) {
  var local = [];
  try { local = JSON.parse(localStorage.getItem("ap-ep-removed") || "[]"); } catch (e) { local = []; }
  if (local.indexOf(id) === -1) local.push(id);
  localStorage.setItem("ap-ep-removed", JSON.stringify(local));
}

function getEpOverrides() {
  var local = {};
  try { local = JSON.parse(localStorage.getItem(STORAGE.epOverride) || "{}"); } catch (e) { local = {}; }
  var pub = _publicOverrides || {};
  var removed = getRemovedOverrideIds();
  var out = {};
  Object.keys(pub).forEach(function (k) { if (!removed[k]) out[k] = pub[k]; });
  Object.keys(local).forEach(function (k) { if (!removed[k]) out[k] = local[k]; });
  return out;
}
function saveEpOverrides(obj) {
  localStorage.setItem(STORAGE.epOverride, JSON.stringify(obj));
}
function getLocalEpOverridesOnly() {
  try { return JSON.parse(localStorage.getItem(STORAGE.epOverride) || "{}"); } catch (e) { return {}; }
}

function getManualCatalog() {
  var local = getLocalManualCatalogOnly();
  var pub = _publicManual || [];
  var map = {};
  pub.forEach(function (m) { if (m && m.id) map[m.id] = m; });
  local.forEach(function (m) { if (m && m.id) map[m.id] = m; });
  return Object.keys(map).map(function (k) { return map[k]; });
}

function getCatOverrides() {
  try { return JSON.parse(localStorage.getItem(STORAGE.catOverride) || "{}"); } catch (e) { return {}; }
}
function saveCatOverrides(obj) {
  localStorage.setItem(STORAGE.catOverride, JSON.stringify(obj));
}

/* Per-title Audio Language badges (shown on anime detail page) */
var _publicLangOverrides = null;
function getLocalLangOverridesOnly() {
  try { return JSON.parse(localStorage.getItem(STORAGE.langOverride) || "{}"); } catch (e) { return {}; }
}
function saveLangOverrides(obj) {
  localStorage.setItem(STORAGE.langOverride, JSON.stringify(obj));
}
function getLangOverrides() {
  var local = getLocalLangOverridesOnly();
  var pub = _publicLangOverrides || {};
  var out = Object.assign({}, pub, local);
  return out;
}
/** Audio-language badges for a title. Falls back to the site default (Hindi/Urdu/Japanese)
 *  when the admin hasn't tagged this title yet. */
function getAudioLangsFor(id) {
  var map = getLangOverrides();
  if (map[id] && map[id].length) return map[id];
  return DEFAULT_AUDIO_LANGS.slice();
}

function mergeCatalog(apiItems) {
  const manual = getManualCatalog();
  const hidden = {};
  getHiddenIds().forEach(function (id) { hidden[id] = true; });
  const seen = {};
  var out = [];
  manual.forEach(function (m) {
    if (hidden[m.id]) return;
    seen[m.id] = true;
    var cats = getCatOverrides();
    if (cats[m.id]) m.category = cats[m.id];
    out.push(m);
  });
  (apiItems || []).forEach(function (i) {
    if (seen[i.id] || hidden[i.id]) return;
    seen[i.id] = true;
    var cats = getCatOverrides();
    if (cats[i.id]) i.category = cats[i.id];
    out.push(i);
  });
  return out;
}

/* ===== Homepage-section-aware manual placement =====
   Admin picks which homepage row(s) a manually added Series/Movie should
   appear in (Trending / Top Rated / Popular Movies / Cartoons & Classics)
   via the "homeSections" field saved on the manual catalog item.
   Legacy manual items saved before this feature existed have no
   "homeSections" field — they default to "trending" so nothing already
   published stops showing up. */
function getManualForSection(sectionKey) {
  return getManualCatalog().filter(function (m) {
    var secs = (m.homeSections && m.homeSections.length) ? m.homeSections : ["trending"];
    return secs.indexOf(sectionKey) !== -1;
  });
}

function mergeCatalogForSection(apiItems, sectionKey) {
  const manual = getManualForSection(sectionKey);
  const hidden = {};
  getHiddenIds().forEach(function (id) { hidden[id] = true; });
  const seen = {};
  var out = [];
  manual.forEach(function (m) {
    if (hidden[m.id]) return;
    seen[m.id] = true;
    var cats = getCatOverrides();
    if (cats[m.id]) m.category = cats[m.id];
    out.push(m);
  });
  (apiItems || []).forEach(function (i) {
    if (seen[i.id] || hidden[i.id]) return;
    seen[i.id] = true;
    var cats = getCatOverrides();
    if (cats[i.id]) i.category = cats[i.id];
    out.push(i);
  });
  return out;
}
