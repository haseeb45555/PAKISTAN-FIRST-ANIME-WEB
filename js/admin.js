/* PakistanAnime Admin — manual series/movies + API episode overrides */
const ADMIN_KEY = "ap-admin-auth";
const DEFAULT_PWD = "ullahyar@321";
const CATS = ["Action","Adventure","Comedy","Drama","Fantasy","Horror","Romance","Sci-Fi","Sports","Thriller","Slice of Life","Supernatural","Mecha","Mystery","Cartoon","Psychological","School","Other"];

function isAuthed() { return sessionStorage.getItem(ADMIN_KEY) === "1"; }
function setAuthed(v) { v ? sessionStorage.setItem(ADMIN_KEY, "1") : sessionStorage.removeItem(ADMIN_KEY); }

function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function esc(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* Login */
var pwdGate = document.getElementById("pwdGate");
var adminPanel = document.getElementById("adminPanel");
if (isAuthed()) { pwdGate.classList.add("hidden"); adminPanel.classList.remove("hidden"); }
document.getElementById("loginBtn").onclick = function () {
  var p = document.getElementById("adminPwd").value;
  if (p === DEFAULT_PWD || p === (localStorage.getItem("ap-admin-pwd") || DEFAULT_PWD)) {
    setAuthed(true);
    pwdGate.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    bootAdmin();
  } else {
    document.getElementById("pwdError").classList.remove("hidden");
  }
};
document.getElementById("adminPwd").onkeydown = function (e) {
  if (e.key === "Enter") document.getElementById("loginBtn").click();
};
document.getElementById("logoutBtn").onclick = function () {
  setAuthed(false);
  location.reload();
};

/* Tabs */
document.querySelectorAll(".admin-tab").forEach(function (t) {
  t.onclick = function () {
    document.querySelectorAll(".admin-tab").forEach(function (x) { x.classList.remove("active"); });
    document.querySelectorAll(".tab-panel").forEach(function (x) { x.classList.remove("active"); });
    t.classList.add("active");
    document.getElementById("tab-" + t.dataset.tab).classList.add("active");
    if (t.dataset.tab === "live") loadLive();
    if (t.dataset.tab === "epedit") renderEpOverrides();
  };
});

/* Category chips */
function buildChips(containerId, selected) {
  var el = document.getElementById(containerId);
  if (!el) return;
  selected = selected || [];
  el.innerHTML = CATS.map(function (c) {
    var on = selected.indexOf(c) !== -1 ? " on" : "";
    return '<button type="button" class="chip' + on + '" data-c="' + c + '">' + c + "</button>";
  }).join("");
  el.querySelectorAll(".chip").forEach(function (chip) {
    chip.onclick = function () { chip.classList.toggle("on"); };
  });
}
function getChips(containerId) {
  return [].slice.call(document.querySelectorAll("#" + containerId + " .chip.on")).map(function (c) { return c.dataset.c; });
}

var manageId = null; // currently managing series id

var AUDIO_LANGS = ["Hindi", "Urdu", "English", "Japanese"];

/* Homepage sections a manual Series/Movie can be placed into.
   key = internal id used by js/api.js + js/app.js, label = shown in admin UI */
var HOME_SECTIONS = [
  { key: "trending", label: "Trending" },
  { key: "topRated", label: "Top Rated" },
  { key: "movies", label: "Popular Movies" },
  { key: "cartoons", label: "Cartoons & Classics" }
];

function buildSectionChips(containerId, selected) {
  var el = document.getElementById(containerId);
  if (!el) return;
  selected = selected || [];
  el.innerHTML = HOME_SECTIONS.map(function (s) {
    var on = selected.indexOf(s.key) !== -1 ? " on" : "";
    return '<button type="button" class="chip' + on + '" data-sec="' + s.key + '">' + s.label + "</button>";
  }).join("");
  el.querySelectorAll(".chip").forEach(function (chip) {
    chip.onclick = function () { chip.classList.toggle("on"); };
  });
}
function getSectionChips(containerId) {
  return [].slice.call(document.querySelectorAll("#" + containerId + " .chip.on")).map(function (c) { return c.dataset.sec; });
}

function bootAdmin() {
  buildChips("sCats", ["Action"]);
  buildChips("mCats", ["Drama"]);
  buildLangChips("sLangs", ["Hindi", "Urdu", "Japanese"]);
  buildLangChips("mLangs", ["Hindi", "Urdu", "Japanese"]);
  buildSectionChips("sSections", ["trending"]);
  buildSectionChips("mSections", ["trending"]);
  renderSeries();
  renderMovies();
  renderEpOverrides();
  // Pull the live public-data.json into memory right away, so every list/merge/publish
  // in this session reflects what's ACTUALLY live — not just this browser's local edits.
  if (typeof loadPublicOverrides === "function") {
    loadPublicOverrides().then(function () {
      renderSeries();
      renderMovies();
      renderEpOverrides();
    }).catch(function () {});
  }
}

function buildLangChips(containerId, selected) {
  var el = document.getElementById(containerId);
  if (!el) return;
  selected = selected || [];
  el.innerHTML = AUDIO_LANGS.map(function (c) {
    var on = selected.indexOf(c) !== -1 ? " on" : "";
    return '<button type="button" class="chip' + on + '" data-lc="' + c + '">' + c + "</button>";
  }).join("");
  el.querySelectorAll(".chip").forEach(function (chip) {
    chip.onclick = function () { chip.classList.toggle("on"); };
  });
}
function getLangChips(containerId) {
  return [].slice.call(document.querySelectorAll("#" + containerId + " .chip.on")).map(function (c) { return c.dataset.lc; });
}

if (isAuthed()) bootAdmin();

/* ===== Manual series ===== */
document.getElementById("addSeriesBtn").onclick = function () {
  var name = document.getElementById("sName").value.trim();
  var poster = document.getElementById("sPoster").value.trim();
  if (!name) return alert("Series name required");
  var id = slugify(name);
  var list = getManualCatalog().filter(function (x) { return x.id !== id; });
  list.unshift({
    id: id,
    title: name,
    type: "SERIES",
    poster: poster,
    rating: document.getElementById("sRating").value || "8.5",
    category: (getChips("sCats")[0] || "Action"),
    categories: getChips("sCats"),
    langs: ["English"],
    audioLangs: getLangChips("sLangs"),
    apiSlug: document.getElementById("sApiSlug").value.trim() || "",
    seasons: {},
    homeSections: (getSectionChips("sSections").length ? getSectionChips("sSections") : ["trending"]),
    manual: true,
    addedAt: Date.now()
  });
  saveManualCatalog(list);
  document.getElementById("sName").value = "";
  document.getElementById("sPoster").value = "";
  document.getElementById("sApiSlug").value = "";
  buildSectionChips("sSections", ["trending"]);
  renderSeries();
  alert("Series added! Ab Manage pe click karke seasons/episodes add karo.");
};

function renderSeries() {
  var list = getManualCatalog().filter(function (x) { return x.type !== "MOVIE"; });
  var q = (document.getElementById("seriesSearch").value || "").toLowerCase();
  if (q) list = list.filter(function (x) { return x.title.toLowerCase().indexOf(q) !== -1; });
  document.getElementById("seriesCount").textContent = list.length;
  var el = document.getElementById("seriesList");
  if (!list.length) {
    el.innerHTML = '<p style="color:var(--text-muted);padding:12px">No manual series yet.</p>';
    return;
  }
  el.innerHTML = list.map(function (a) {
    var epCount = 0;
    var seasons = a.seasons || {};
    Object.keys(seasons).forEach(function (s) { epCount += (seasons[s] || []).length; });
    var seasonCount = Object.keys(seasons).length;
    var curSections = (a.homeSections && a.homeSections.length) ? a.homeSections : ["trending"];
    return '<div class="series-row">' +
      '<img src="' + esc(a.poster) + '" alt="" />' +
      '<div class="info"><h4>' + esc(a.title) + '</h4>' +
      '<span><span class="badge badge-s">Series</span> ⭐ ' + esc(a.rating) + ' · ' +
      seasonCount + ' season(s) · ' + epCount + ' episode(s) · ' + esc((a.categories || []).join(", ")) + '</span>' +
      '<div class="chip-row" data-secid="' + esc(a.id) + '" style="margin-top:6px">' +
      HOME_SECTIONS.map(function (s) {
        return '<button type="button" class="chip' + (curSections.indexOf(s.key) !== -1 ? " on" : "") + '" data-sec="' + s.key + '" style="font-size:0.7rem;padding:3px 8px">' + s.label + "</button>";
      }).join("") + '</div></div>' +
      '<div class="actions">' +
      '<button class="btn-pink" data-manage="' + a.id + '">📁 Manage</button>' +
      '<button class="btn-ghost2" data-del="' + a.id + '">🗑</button>' +
      '</div></div>';
  }).join("");
  el.querySelectorAll("[data-manage]").forEach(function (b) {
    b.onclick = function () { openManage(b.dataset.manage); };
  });
  el.querySelectorAll("[data-del]").forEach(function (b) {
    b.onclick = function () {
      if (!confirm("Delete series?")) return;
      saveManualCatalog(getManualCatalog().filter(function (x) { return x.id !== b.dataset.del; }));
      renderSeries();
    };
  });
  bindSectionRowChips(el);
}

/** Shared by renderSeries()/renderMovies(): lets admin change a manual item's
 *  homepage placement (Trending/Top Rated/Popular Movies/Cartoons) any time,
 *  without deleting and re-adding the item (which would wipe seasons/servers). */
function bindSectionRowChips(el) {
  el.querySelectorAll("[data-secid]").forEach(function (row) {
    var id = row.dataset.secid;
    row.querySelectorAll(".chip").forEach(function (chip) {
      chip.onclick = function () {
        chip.classList.toggle("on");
        var selected = [].slice.call(row.querySelectorAll(".chip.on")).map(function (c) { return c.dataset.sec; });
        var list = getManualCatalog();
        var item = list.find(function (x) { return x.id === id; });
        if (!item) return;
        item.homeSections = selected.length ? selected : ["trending"];
        saveManualCatalog(list);
      };
    });
  });
}
document.getElementById("seriesSearch").oninput = renderSeries;

/* Manage seasons/episodes */
function openManage(id) {
  manageId = id;
  var a = getManualCatalog().find(function (x) { return x.id === id; });
  if (!a) return;
  document.getElementById("manageTitle").textContent = a.title;
  document.getElementById("manageModal").classList.remove("hidden");
  renderSeasons();
}
document.getElementById("closeManage").onclick = function () {
  document.getElementById("manageModal").classList.add("hidden");
  manageId = null;
  renderSeries();
};

function renderSeasons() {
  var a = getManualCatalog().find(function (x) { return x.id === manageId; });
  if (!a) return;
  var seasons = a.seasons || {};
  var keys = Object.keys(seasons).sort(function (x, y) { return +x - +y; });
  var box = document.getElementById("seasonsBox");
  if (!keys.length) {
    box.innerHTML = '<p style="color:var(--text-muted)">No seasons. Add one above.</p>';
    return;
  }
  box.innerHTML = keys.map(function (s) {
    var eps = seasons[s] || [];
    return '<div style="border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:12px;background:var(--bg)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">' +
      '<div><strong>Season ' + s + '</strong> <span style="color:var(--text-muted);font-size:0.85rem">' + eps.length + ' episode(s)</span></div>' +
      '<div style="display:flex;gap:6px">' +
      '<button class="btn-danger" data-delseason="' + s + '">🗑 Delete Season</button>' +
      '</div></div>' +
      (eps.length
        ? eps.map(function (ep, idx) {
          return '<div class="ep-item"><div><strong>E' + ep.number + '</strong> ' + esc(ep.title) +
            (ep.servers && ep.servers.s2 ? ' <span style="color:#34d399;font-size:0.75rem">· S2</span>' : '') +
            '</div><div style="display:flex;gap:6px">' +
            '<button class="btn-ghost2" data-editep="' + s + ':' + idx + '">Edit</button>' +
            '<button class="btn-danger" data-delep="' + s + ':' + idx + '">🗑</button>' +
            '</div></div>';
        }).join("")
        : '<p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:8px">Is season me abhi koi episode nahi. Niche "+ Add Episode" dabao.</p>') +
      '<button class="btn-pink" style="margin-top:8px" data-addep="' + s + '">+ Add Episode — Season ' + s + '</button>' +
      '</div>';
  }).join("");

  box.querySelectorAll("[data-addep]").forEach(function (b) {
    b.onclick = function () { openEpForm(b.dataset.addep, -1); };
  });
  box.querySelectorAll("[data-editep]").forEach(function (b) {
    b.onclick = function () {
      var parts = b.dataset.editep.split(":");
      openEpForm(parts[0], +parts[1]);
    };
  });
  box.querySelectorAll("[data-delep]").forEach(function (b) {
    b.onclick = function () {
      var parts = b.dataset.delep.split(":");
      var list = getManualCatalog();
      var a = list.find(function (x) { return x.id === manageId; });
      if (!a || !a.seasons[parts[0]]) return;
      a.seasons[parts[0]].splice(+parts[1], 1);
      saveManualCatalog(list);
      renderSeasons();
    };
  });
  box.querySelectorAll("[data-delseason]").forEach(function (b) {
    b.onclick = function () {
      if (!confirm("Delete season " + b.dataset.delseason + "?")) return;
      var list = getManualCatalog();
      var a = list.find(function (x) { return x.id === manageId; });
      if (!a) return;
      delete a.seasons[b.dataset.delseason];
      saveManualCatalog(list);
      renderSeasons();
    };
  });
}

document.getElementById("addSeasonBtn").onclick = function () {
  if (!manageId) return;
  var n = String(document.getElementById("newSeasonNum").value || "1");
  var list = getManualCatalog();
  var a = list.find(function (x) { return x.id === manageId; });
  if (!a) return;
  if (!a.seasons) a.seasons = {};
  if (!a.seasons[n]) a.seasons[n] = [];
  saveManualCatalog(list);
  renderSeasons();
};

function openEpForm(season, index) {
  document.getElementById("epEditSeason").value = season;
  document.getElementById("epEditIndex").value = index;
  document.getElementById("epModalTitle").textContent = index < 0 ? "Add Episode — S" + season : "Edit Episode — S" + season;
  if (index >= 0) {
    var a = getManualCatalog().find(function (x) { return x.id === manageId; });
    var ep = a.seasons[season][index];
    document.getElementById("epNum").value = ep.number;
    document.getElementById("epTitle").value = ep.title || "";
    document.getElementById("epThumb").value = ep.thumbnail || "";
    document.getElementById("epSrv1").value = (ep.servers && ep.servers.s1) || "";
    document.getElementById("epSrv2").value = (ep.servers && ep.servers.s2) || "";
    document.getElementById("epSrv3").value = (ep.servers && ep.servers.s3) || "";
    var el = ep.langs || {};
    if (document.getElementById("epSrv1Lang")) document.getElementById("epSrv1Lang").value = el.s1 || "";
    if (document.getElementById("epSrv2Lang")) document.getElementById("epSrv2Lang").value = el.s2 || "";
    if (document.getElementById("epSrv3Lang")) document.getElementById("epSrv3Lang").value = el.s3 || "";
  } else {
    var a = getManualCatalog().find(function (x) { return x.id === manageId; });
    var next = ((a.seasons[season] || []).length) + 1;
    document.getElementById("epNum").value = next;
    document.getElementById("epTitle").value = "Episode " + next;
    document.getElementById("epThumb").value = "";
    document.getElementById("epSrv1").value = "";
    document.getElementById("epSrv2").value = "";
    document.getElementById("epSrv3").value = "";
    if (document.getElementById("epSrv1Lang")) document.getElementById("epSrv1Lang").value = "";
    if (document.getElementById("epSrv2Lang")) document.getElementById("epSrv2Lang").value = "";
    if (document.getElementById("epSrv3Lang")) document.getElementById("epSrv3Lang").value = "";
  }
  document.getElementById("epModal").classList.remove("hidden");
}
document.getElementById("closeEpModal").onclick = document.getElementById("cancelEpBtn").onclick = function () {
  document.getElementById("epModal").classList.add("hidden");
};
document.getElementById("saveEpBtn").onclick = function () {
  var season = document.getElementById("epEditSeason").value;
  var index = +document.getElementById("epEditIndex").value;
  var list = getManualCatalog();
  var a = list.find(function (x) { return x.id === manageId; });
  if (!a) return;
  if (!a.seasons) a.seasons = {};
  if (!a.seasons[season]) a.seasons[season] = [];
  var ep = {
    number: document.getElementById("epNum").value,
    title: document.getElementById("epTitle").value.trim() || ("Episode " + document.getElementById("epNum").value),
    thumbnail: document.getElementById("epThumb").value.trim(),
    servers: {
      s1: document.getElementById("epSrv1").value.trim(),
      s2: document.getElementById("epSrv2").value.trim(),
      s3: document.getElementById("epSrv3").value.trim()
    },
    langs: {
      s1: (document.getElementById("epSrv1Lang") && document.getElementById("epSrv1Lang").value) || "",
      s2: (document.getElementById("epSrv2Lang") && document.getElementById("epSrv2Lang").value) || "",
      s3: (document.getElementById("epSrv3Lang") && document.getElementById("epSrv3Lang").value) || ""
    }
  };
  if (index >= 0) a.seasons[season][index] = ep;
  else a.seasons[season].push(ep);
  saveManualCatalog(list);
  document.getElementById("epModal").classList.add("hidden");
  renderSeasons();
};

/* ===== Movies ===== */
document.getElementById("addMovieBtn").onclick = function () {
  var name = document.getElementById("mName").value.trim();
  if (!name) return alert("Movie name required");
  var id = slugify(name);
  var list = getManualCatalog().filter(function (x) { return x.id !== id; });
  list.unshift({
    id: id,
    title: name,
    type: "MOVIE",
    poster: document.getElementById("mPoster").value.trim(),
    rating: document.getElementById("mRating").value || "8.0",
    category: (getChips("mCats")[0] || "Drama"),
    categories: getChips("mCats"),
    langs: ["English"],
    audioLangs: getLangChips("mLangs"),
    apiSlug: document.getElementById("mApiSlug").value.trim() || "",
    servers: {
      s1: document.getElementById("mS1").value.trim(),
      s2: document.getElementById("mS2").value.trim(),
      s3: document.getElementById("mS3").value.trim()
    },
    homeSections: (getSectionChips("mSections").length ? getSectionChips("mSections") : ["trending"]),
    manual: true,
    addedAt: Date.now()
  });
  saveManualCatalog(list);
  ["mName","mPoster","mApiSlug","mS1","mS2","mS3"].forEach(function (id) {
    document.getElementById(id).value = "";
  });
  buildSectionChips("mSections", ["trending"]);
  renderMovies();
  alert("Movie added!");
};

function renderMovies() {
  var list = getManualCatalog().filter(function (x) { return x.type === "MOVIE"; });
  document.getElementById("movieCount").textContent = list.length;
  var el = document.getElementById("movieList");
  if (!list.length) {
    el.innerHTML = '<p style="color:var(--text-muted);padding:12px">No manual movies yet.</p>';
    return;
  }
  el.innerHTML = list.map(function (a) {
    var curSections = (a.homeSections && a.homeSections.length) ? a.homeSections : ["trending"];
    return '<div class="series-row">' +
      '<img src="' + esc(a.poster) + '" />' +
      '<div class="info"><h4>' + esc(a.title) + '</h4>' +
      '<span><span class="badge badge-m">Movie</span> ⭐ ' + esc(a.rating) +
      (a.servers && a.servers.s2 ? ' · S2 set' : '') + '</span>' +
      '<div class="chip-row" data-secid="' + esc(a.id) + '" style="margin-top:6px">' +
      HOME_SECTIONS.map(function (s) {
        return '<button type="button" class="chip' + (curSections.indexOf(s.key) !== -1 ? " on" : "") + '" data-sec="' + s.key + '" style="font-size:0.7rem;padding:3px 8px">' + s.label + "</button>";
      }).join("") + '</div></div>' +
      '<div class="actions"><button class="btn-danger" data-delm="' + a.id + '">🗑 Delete</button></div></div>';
  }).join("");
  el.querySelectorAll("[data-delm]").forEach(function (b) {
    b.onclick = function () {
      if (!confirm("Delete movie?")) return;
      saveManualCatalog(getManualCatalog().filter(function (x) { return x.id !== b.dataset.delm; }));
      renderMovies();
    };
  });
  bindSectionRowChips(el);
}

/* ===== API episode override ===== */
function normalizeEpisodeId(raw) {
  var s = String(raw || "").trim();
  if (!s) return "";
  // Full watch URL or query string → extract ep=
  try {
    if (s.indexOf("ep=") !== -1) {
      var q = s.indexOf("?") >= 0 ? s.split("?").pop() : s;
      var params = new URLSearchParams(q.indexOf("ep=") === 0 || q.indexOf("&") >= 0 ? q : ("?" + q).replace(/^\?\?/, "?"));
      // simpler parse
      var m = s.match(/[?&]ep=([^&]+)/);
      if (m) return decodeURIComponent(m[1]).trim();
    }
  } catch (e) {}
  // path style .../watch/xxx or trailing slug
  if (s.indexOf("watch.html") !== -1) {
    var m2 = s.match(/ep=([^&\s]+)/);
    if (m2) return decodeURIComponent(m2[1]).trim();
  }
  return s;
}

bindExportBtn();

function buildEpisodeIdFromFields() {
  var slug = (document.getElementById("epAnimeSlug") && document.getElementById("epAnimeSlug").value || "").trim();
  var season = (document.getElementById("epSeason") && document.getElementById("epSeason").value) || "1";
  var num = (document.getElementById("epNumber") && document.getElementById("epNumber").value) || "1";
  // clean slug from full url
  if (slug.indexOf("id=") !== -1) {
    var m = slug.match(/[?&]id=([^&]+)/);
    if (m) slug = decodeURIComponent(m[1]);
  }
  slug = slug.replace(/^\/+/, "").replace(/\.html.*/, "");
  if (!slug) return "";
  // Normalize to the site's actual slug format (lowercase, hyphenated) —
  // typing the display title ("Re Zero - Starting...") instead of the
  // slug ("re-zero-starting...") used to save an ID that never matched
  // the anime on the public site. slugify() fixes that automatically.
  slug = slugify(slug);
  return slug + "-" + season + "x" + num;
}

function syncEpisodeIdField() {
  var el = document.getElementById("epId");
  if (!el) return;
  var built = buildEpisodeIdFromFields();
  if (built) el.value = built;
}

["epAnimeSlug", "epSeason", "epNumber"].forEach(function (id) {
  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === id) syncEpisodeIdField();
  });
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === id) syncEpisodeIdField();
  });
});

document.getElementById("epSaveBtn").onclick = function () {
  syncEpisodeIdField();
  var epId = normalizeEpisodeId(document.getElementById("epId").value);
  if (!epId) return alert("Episode ID required");
  document.getElementById("epId").value = epId; // show cleaned id
  var o = getEpOverrides();
  var epTitle = (document.getElementById("epTitle") && document.getElementById("epTitle").value || "").trim();
  var epThumb = (document.getElementById("epApiThumb") && document.getElementById("epApiThumb").value.trim()) || "";
  var langEl1 = document.getElementById("epS1Lang"), langEl2 = document.getElementById("epS2Lang"), langEl3 = document.getElementById("epS3Lang");
  o[epId] = {
    servers: {
      s1: document.getElementById("epS1").value.trim(),
      s2: document.getElementById("epS2").value.trim(),
      s3: document.getElementById("epS3").value.trim()
    },
    langs: {
      s1: langEl1 ? langEl1.value : "",
      s2: langEl2 ? langEl2.value : "",
      s3: langEl3 ? langEl3.value : ""
    },
    stream: document.getElementById("epS1").value.trim() || document.getElementById("epS2").value.trim(),
    title: epTitle,
    thumbnail: epThumb,
    note: document.getElementById("epNote").value.trim() || epTitle,
    updated: Date.now()
  };
  saveEpOverrides(o);
  document.getElementById("epId").value = "";
  document.getElementById("epS1").value = "";
  document.getElementById("epS2").value = "";
  document.getElementById("epS3").value = "";
  document.getElementById("epApiThumb").value = "";
  document.getElementById("epNote").value = "";
  if (langEl1) langEl1.value = "";
  if (langEl2) langEl2.value = "";
  if (langEl3) langEl3.value = "";
  renderEpOverrides();
  alert("Saved! Link/picture khali chhoda ho to koi masla nahi — jab bhi milein, isi Anime ID + Season + Episode number se dobara khol ke bas Server/Picture bhar ke Save karo, phir Publish karo. Agar koi server 'Hindi' tagged hai to woh site pe auto-default play hoga.");
};

function renderEpOverrides() {
  var el = document.getElementById("epOverrideList");
  if (!el) return;
  // show local + public merged so admin sees everything
  try { if (typeof loadPublicOverrides === "function") loadPublicOverrides().then(function () { /* re-render after */ }); } catch (e) {}
  var o = getEpOverrides();
  var keys = Object.keys(o).sort();
  if (!keys.length) {
    el.innerHTML = '<p style="color:var(--text-muted)">No overrides yet. Save below, then Export Public JSON and upload to hosting.</p>';
    return;
  }
  el.innerHTML = keys.map(function (k) {
    var s = o[k].servers || {};
    var l = o[k].langs || {};
    function tag(key) { return s[key] ? (" · S" + key.slice(1) + (l[key] ? (" (" + l[key] + ")") : "")) : ""; }
    var hasLink = !!(s.s1 || s.s2 || s.s3);
    var hasPic = !!o[k].thumbnail;
    var pending = (!hasLink || !hasPic)
      ? ' <span style="color:#eab308;font-size:0.7rem;font-weight:700">· PENDING: ' +
        [!hasLink ? "link" : null, !hasPic ? "picture" : null].filter(Boolean).join(" + ") +
        '</span>'
      : '';
    return '<div class="ep-item"><div style="flex:1;cursor:pointer" data-epedit="' + esc(k) + '"><strong>' + esc(k) + '</strong>' + pending + '<br/><span style="font-size:0.75rem;color:var(--text-muted)">' +
      esc(o[k].note || "") +
      tag("s1") + tag("s2") + tag("s3") + "</span></div>" +
      '<button class="btn" data-epedit="' + esc(k) + '" style="margin-right:6px">Edit</button>' +
      '<button class="btn-danger" data-epdel="' + esc(k) + '">Remove</button></div>';
  }).join("");
  el.querySelectorAll("[data-epdel]").forEach(function (b) {
    b.onclick = function (e) {
      e.stopPropagation();
      var id = b.dataset.epdel;
      // remove from local storage
      var o = (typeof getLocalEpOverridesOnly === "function") ? getLocalEpOverridesOnly() : {};
      delete o[id];
      saveEpOverrides(o);
      // also blacklist so public overrides.json item disappears from list & site (this browser)
      if (typeof addRemovedOverrideId === "function") addRemovedOverrideId(id);
      renderEpOverrides();
    };
  });
  el.querySelectorAll("[data-epedit]").forEach(function (b) {
    b.onclick = function (e) {
      e.stopPropagation();
      var id = b.dataset.epedit;
      var o = getEpOverrides();
      var row = o[id] || {};
      var s = row.servers || {};
      document.getElementById("epId").value = id;
      // parse slug-1x12
      var mm = String(id).match(/^(.*)-(\d+)x(\d+)$/);
      if (mm) {
        var slugEl = document.getElementById("epAnimeSlug");
        var seEl = document.getElementById("epSeason");
        var nuEl = document.getElementById("epNumber");
        if (slugEl) slugEl.value = mm[1];
        if (seEl) seEl.value = mm[2];
        if (nuEl) nuEl.value = mm[3];
      }
      var titleEl = document.getElementById("epTitle");
      if (titleEl) titleEl.value = row.title || "";
      var thumbEl = document.getElementById("epApiThumb");
      if (thumbEl) thumbEl.value = row.thumbnail || "";
      document.getElementById("epS1").value = s.s1 || "";
      document.getElementById("epS2").value = s.s2 || "";
      document.getElementById("epS3").value = s.s3 || "";
      var rl = row.langs || {};
      var l1 = document.getElementById("epS1Lang"), l2 = document.getElementById("epS2Lang"), l3 = document.getElementById("epS3Lang");
      if (l1) l1.value = rl.s1 || "";
      if (l2) l2.value = rl.s2 || "";
      if (l3) l3.value = rl.s3 || "";
      document.getElementById("epNote").value = row.note || "";
      document.getElementById("epId").scrollIntoView({ behavior: "smooth", block: "center" });
    };
  });
}

function buildPublicData() {
  // IMPORTANT: this must include the LIVE data already on the public site (fetched via
  // loadPublicOverrides) merged with this browser's local changes — not local-only.
  // Otherwise publishing from a browser/device that doesn't have full local history
  // (e.g. only just added a movie) would overwrite and wipe out episodes/series that
  // were only ever saved on the live site / a different browser.
  var overrides = (typeof getEpOverrides === "function") ? getEpOverrides() : {};
  var removedLocal = [];
  try { removedLocal = JSON.parse(localStorage.getItem("ap-ep-removed") || "[]"); } catch (e) {}
  var removedPublic = (typeof _publicRemoved !== "undefined" && Array.isArray(_publicRemoved)) ? _publicRemoved : [];
  var removedSet = {};
  removedLocal.concat(removedPublic).forEach(function (id) { removedSet[id] = true; });
  var removed = Object.keys(removedSet);
  // exclude removed keys from overrides (getEpOverrides already does this, but double-guard)
  removed.forEach(function (id) { delete overrides[id]; });
  var manual = (typeof getManualCatalog === "function") ? getManualCatalog() : [];
  var langOverrides = (typeof getLangOverrides === "function") ? getLangOverrides() : {};
  var hidden = [];
  try {
    if (typeof getHiddenIds === "function") hidden = getHiddenIds();
    else hidden = JSON.parse(localStorage.getItem("ap-hidden-ids") || "[]");
  } catch (e) { hidden = []; }
  return {
    overrides: overrides,
    manual: manual,
    removedOverrides: removed,
    hidden: hidden,
    langOverrides: langOverrides,
    updated: Date.now()
  };
}

async function exportPublicOverrides() {
  try {
    // Always pull the CURRENT live public-data.json first so nothing already
    // published (from this or any other browser/device) gets lost.
    if (typeof loadPublicOverrides === "function") {
      try { await loadPublicOverrides(); } catch (e) {}
    }
    var data = buildPublicData();
    var nEp = Object.keys(data.overrides || {}).length;
    var nMan = (data.manual || []).length;
    if (!nEp && !nMan) {
      alert("Kuch save nahi hai.\nPehle Movie add karo ya Episode Override save karo, phir Download.");
      return;
    }
    // download public-data.json (movies + episode overrides) — MAIN public file
    var text = JSON.stringify(data, null, 2);
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "public-data.json";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // also overrides.json for backward compat
    setTimeout(function () {
      var blob2 = new Blob([JSON.stringify(data.overrides || {}, null, 2)], { type: "application/json" });
      var url2 = URL.createObjectURL(blob2);
      var a2 = document.createElement("a");
      a2.href = url2;
      a2.download = "overrides.json";
      a2.style.display = "none";
      document.body.appendChild(a2);
      a2.click();
      setTimeout(function () {
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(url2);
        a.remove();
        a2.remove();
      }, 800);
    }, 400);
    alert("Downloaded:\n1) public-data.json (" + nMan + " manual + " + nEp + " episode overrides)\n2) overrides.json\n\nDono files hosting ROOT pe upload karo (index.html ke saath).");
  } catch (err) {
    console.error(err);
    alert("Download failed: " + (err && err.message ? err.message : err));
  }
}

function clearAllEpisodeOverrides() {
  if (!confirm("Saare episode overrides (local) delete? Public file alag se empty upload karni hogi.")) return;
  saveEpOverrides({});
  localStorage.setItem("ap-ep-removed", "[]");
  renderEpOverrides();
  alert("Local overrides clear. Public ke liye empty overrides.json / public-data.json upload karo.");
}

function bindExportBtn() {
  var b = document.getElementById("epExportBtn");
  if (b) b.onclick = function (e) { if (e) e.preventDefault(); exportPublicOverrides(); };
  var c = document.getElementById("epClearBtn");
  if (c) c.onclick = function (e) { if (e) e.preventDefault(); clearAllEpisodeOverrides(); };
  var p = document.getElementById("publishAllBtn");
  if (p) p.onclick = function (e) { if (e) e.preventDefault(); exportPublicOverrides(); };
  var p2 = document.getElementById("publishAllBtn2");
  if (p2) p2.onclick = function (e) { if (e) e.preventDefault(); exportPublicOverrides(); };
}

/* ===== Live catalog ===== */
async function loadLive() {
  var box = document.getElementById("liveList");
  box.innerHTML = '<p style="color:var(--text-muted)">Loading FULL catalog (not just 83)…</p>';
  var items = [];
  var seen = {};

  function pushItems(arr) {
    (arr || []).forEach(function (i) {
      if (!i || !i.id || seen[i.id]) return;
      seen[i.id] = true;
      items.push(i);
    });
  }

  /* 1) catalog-index.json — full list (~500+) */
  var indexPaths = ["catalog-index.json", "/catalog-index.json", "./catalog-index.json"];
  for (var pi = 0; pi < indexPaths.length; pi++) {
    try {
      var idxRes = await fetch(indexPaths[pi], { cache: "no-store" });
      if (!idxRes.ok) continue;
      var idx = await idxRes.json();
      var raw = (idx && idx.items) ? idx.items : (Array.isArray(idx) ? idx : []);
      pushItems(raw.map(function (x) {
        return {
          id: x.id || x.slug,
          title: x.title || x.id,
          type: x.type || "SERIES",
          poster: x.poster || x.image || "",
          url: x.url || ""
        };
      }));
      if (items.length) {
        box.innerHTML = '<p style="color:var(--text-muted)">Index: ' + items.length + ' titles — live top-up…</p>';
        break;
      }
    } catch (e) {}
  }

  /* 2) Home sections */
  try {
    var home = await fetchHome();
    var sections = mapHomeSections(home);
    Object.keys(sections).forEach(function (k) { pushItems(sections[k].items || []); });
  } catch (e) {}

  /* 3) Live search — many queries (API ~12 each). Parallel batches. */
  var queries = "abcdefghijklmnopqrstuvwxyz0123456789".split("").concat([
    "th","an","on","in","er","ar","re","st","tr","bl","sp","po","so","ko","na","ba","ma","sa","ta","wa",
    "sh","ch","pr","dr","cr","fr","gr","br","cl","pl","sl","qu","jo","ha","hi","ho","hu","he","ya","yo",
    "the","one","naruto","bleach","dragon","solo","barbie","shin","winx","spy","bad","ben","digimon",
    "power","family","king","love","death","world","hero","girl","black","my","no","re","go","zom",
    "your","name","piece","level","attack","titan","note","slime","guard","over","lord","fairy"
  ]);
  var batchSize = 6;
  for (var qi = 0; qi < queries.length; qi += batchSize) {
    var batch = queries.slice(qi, qi + batchSize);
    var results = await Promise.all(batch.map(function (q) {
      return fetchSearch(q).catch(function () { return []; });
    }));
    results.forEach(function (extra) { pushItems(extra); });
    box.innerHTML = '<p style="color:var(--text-muted)">Loading full catalog… <b>' + items.length + '</b> titles (' + Math.min(qi + batchSize, queries.length) + '/' + queries.length + ')</p>';
  }

  items.sort(function (a, b) {
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
  getManualCatalog().forEach(function (m) {
    if (!seen[m.id]) { items.unshift(m); seen[m.id] = true; }
  });

  window._liveCatalogItems = items;
  var liveSearch = document.getElementById("liveSearch");
  if (liveSearch && !liveSearch._bound) {
    liveSearch._bound = true;
    liveSearch.oninput = function () {
      renderLiveList(liveSearch.value || "");
    };
  }
  renderLiveList(liveSearch ? liveSearch.value : "");
}

function renderLiveList(q) {
  var box = document.getElementById("liveList");
  if (!box) return;
  var items = window._liveCatalogItems || [];
  q = String(q || "").toLowerCase().trim();
  var filtered = items;
  if (q) {
    filtered = items.filter(function (a) {
      return (a.title || "").toLowerCase().indexOf(q) !== -1 ||
        (a.id || "").toLowerCase().indexOf(q) !== -1 ||
        (a.type || "").toLowerCase().indexOf(q) !== -1 ||
        (a.category || "").toLowerCase().indexOf(q) !== -1;
    });
  }
  var hidden = getHiddenIds();
  var cats = getCatOverrides();
  var langsMap = (typeof getLangOverrides === "function") ? getLangOverrides() : {};
  var countEl = document.getElementById("liveCount");
  if (countEl) {
    countEl.textContent = q ? (filtered.length + " / " + items.length) : String(items.length);
  }
  if (!filtered.length) {
    box.innerHTML = '<p style="color:var(--text-muted);padding:12px">No match' + (q ? ' for "' + esc(q) + '"' : '') + '.</p>';
    return;
  }
  box.innerHTML = filtered.map(function (a) {
    var isHid = hidden.indexOf(a.id) !== -1;
    var cat = cats[a.id] || a.category || "";
    var curLangs = langsMap[a.id] || [];
    return '<div class="series-row" style="opacity:' + (isHid ? "0.5" : "1") + '">' +
      '<img src="' + esc(a.poster) + '" />' +
      '<div class="info"><h4>' + esc(a.title) + (isHid ? " (hidden)" : "") + '</h4>' +
      '<span>' + a.type + (cat ? " · " + cat : "") + '</span>' +
      '<div class="chip-row" data-langid="' + esc(a.id) + '" style="margin-top:6px">' +
      AUDIO_LANGS.map(function (l) {
        return '<button type="button" class="chip' + (curLangs.indexOf(l) !== -1 ? " on" : "") + '" data-l="' + l + '" style="font-size:0.7rem;padding:3px 8px">' + l + "</button>";
      }).join("") + '</div></div>' +
      '<div class="actions">' +
      '<select data-catid="' + a.id + '" style="padding:6px 8px;border-radius:8px;background:var(--bg);color:var(--text);border:1px solid var(--border);font-size:0.75rem">' +
      '<option value="">Category</option>' +
      CATS.map(function (c) { return '<option value="' + c + '"' + (cat === c ? " selected" : "") + ">" + c + "</option>"; }).join("") +
      '</select>' +
      '<button class="btn-ghost2" data-hide="' + a.id + '" title="Public site se hide/show — Export Public JSON ke baad upload karo">' + (isHid ? "Show on site" : "Remove from site") + "</button>" +
      "</div></div>";
  }).join("");
  box.querySelectorAll("[data-langid]").forEach(function (row) {
    var id = row.dataset.langid;
    row.querySelectorAll(".chip").forEach(function (chip) {
      chip.onclick = function () {
        chip.classList.toggle("on");
        var map = (typeof getLocalLangOverridesOnly === "function") ? getLocalLangOverridesOnly() : {};
        var selected = [].slice.call(row.querySelectorAll(".chip.on")).map(function (c) { return c.dataset.l; });
        if (selected.length) map[id] = selected; else delete map[id];
        if (typeof saveLangOverrides === "function") saveLangOverrides(map);
      };
    });
  });
  box.querySelectorAll("[data-hide]").forEach(function (btn) {
    btn.onclick = function () {
      var h = getHiddenIds().slice();
      var i = h.indexOf(btn.dataset.hide);
      if (i === -1) h.push(btn.dataset.hide); else h.splice(i, 1);
      saveHiddenIds(h);
      var liveSearch = document.getElementById("liveSearch");
      renderLiveList(liveSearch ? liveSearch.value : "");
    };
  });
  box.querySelectorAll("[data-catid]").forEach(function (sel) {
    sel.onchange = function () {
      var cats = getCatOverrides();
      if (sel.value) cats[sel.dataset.catid] = sel.value;
      else delete cats[sel.dataset.catid];
      saveCatOverrides(cats);
    };
  });
}

bindExportBtn();
document.addEventListener("DOMContentLoaded", bindExportBtn);
