/* Anime Pakistan — App Logic (Live API + fallbacks) */

(function () {
  // Theme
  const savedTheme = localStorage.getItem("ap-theme") || "dark";
  if (savedTheme === "dark") document.documentElement.setAttribute("data-theme", "dark");

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("ap-theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("ap-theme", "dark");
    }
  });

  // Mobile menu
  const mobileBtn = document.getElementById("mobileMenuBtn");
  const mobileNav = document.getElementById("mobileNav");
  if (mobileBtn && mobileNav) {
    mobileBtn.addEventListener("click", () => mobileNav.classList.toggle("open"));
  }

  // FAQ
  document.querySelectorAll(".faq-q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    });
  });

  // Search modal
  const searchBtn = document.getElementById("searchBtn");
  const searchModal = document.getElementById("searchModal");
  const searchClose = document.getElementById("searchClose");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  if (searchBtn && searchModal) {
    searchBtn.addEventListener("click", () => {
      searchModal.classList.add("open");
      searchInput?.focus();
    });
    searchClose?.addEventListener("click", () => searchModal.classList.remove("open"));
    searchModal.addEventListener("click", (e) => {
      if (e.target === searchModal) searchModal.classList.remove("open");
    });
  }

  let searchTimer;
  if (searchInput && searchResults) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      const q = searchInput.value.trim();
      if (!q) {
        searchResults.innerHTML = "";
        return;
      }
      searchResults.innerHTML = `<p style="padding:16px;text-align:center;color:var(--text-muted)">Searching…</p>`;
      searchTimer = setTimeout(async () => {
        const hits = await fetchSearch(q);
        searchResults.innerHTML =
          hits
            .slice(0, 10)
            .map(
              (a) => `
          <a href="anime.html?id=${encodeURIComponent(a.id)}" class="search-result-item">
            <img src="${a.poster}" alt="" loading="lazy" onerror="this.style.opacity=0.3" />
            <div>
              <h4>${escapeHtml(a.title)}</h4>
              <span>${a.type}</span>
            </div>
          </a>`
            )
            .join("") ||
          `<p style="padding:16px;color:var(--text-muted);text-align:center">No results found</p>`;
      }, 350);
    });
  }


  const CATEGORY_POOL = ["Action","Adventure","Comedy","Drama","Fantasy","Horror","Romance","Sci-Fi","Sports","Thriller","Slice of Life","Supernatural","Mecha","Mystery","Cartoon"];

  function hashStr(s) {
    var h = 0;
    s = String(s || "");
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
    return Math.abs(h);
  }

  function assignCategory(item) {
    if (!item) return item;
    if (item.category) return item;
    if (item.genres && item.genres.length) {
      item.category = item.genres[0];
      return item;
    }
    item.category = CATEGORY_POOL[hashStr(item.id || item.title) % CATEGORY_POOL.length];
    return item;
  }

  function assignCategories(list) {
    return (list || []).map(assignCategory);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function createCard(item) {
    return `
      <a href="anime.html?id=${encodeURIComponent(item.id)}" class="card">
        <div class="card-poster">
          <img src="${item.poster || ""}" alt="${escapeHtml(item.title)}" loading="lazy"
            onerror="this.style.display='none';this.nextElementSibling.style.display='grid'" />
          <div class="placeholder-poster" style="display:none">🎌</div>
          <span class="card-badge">${item.type || "SERIES"}</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
          <p class="card-meta">${item.type || ""}</p>
        </div>
      </a>`;
  }

  function createContinueCard(item) {
    return `
      <a href="anime.html?id=${encodeURIComponent(item.id)}" class="continue-card">
        <img src="${item.poster || item.image || ""}" alt="${escapeHtml(item.title)}" loading="lazy" />
        <div class="play-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="continue-overlay">
          <div class="continue-title">${escapeHtml(item.title)}</div>
          <div class="continue-ep">${item.ep || item.type || ""}</div>
          <div class="progress-bar"><span style="width:${item.progress || 10}%"></span></div>
        </div>
      </a>`;
  }

  function showLoading(el, text) {
    if (el) el.innerHTML = `<div style="padding:24px;color:var(--text-muted);width:100%;text-align:center">${text || "Loading…"}</div>`;
  }

  // ========== HOME ==========
  async function initHome() {
    const trendingEl = document.getElementById("trendingSeries");
    const moviesEl = document.getElementById("popularMovies");
    const topEl = document.getElementById("topRated");
    const cartoonsEl = document.getElementById("cartoons");
    const continueEl = document.getElementById("continueWatching");
    const slidesEl = document.getElementById("heroSlides");
    if (!trendingEl && !slidesEl) return;

    showLoading(trendingEl, "Loading live anime…");
    showLoading(moviesEl);
    showLoading(cartoonsEl);

    try { if (typeof loadPublicOverrides === 'function') await loadPublicOverrides(); } catch (e) {}
    const homeData = await fetchHome();
    const sections = mapHomeSections(homeData);

    // Pin featured titles at start (user request)
    const PINNED = [
      "solo-leveling",
      "re-zero-starting-life-in-another-world",
      "dragon-ball-super",
      "chainsaw-man"
    ];
    const HIDE_FROM_HERO = ["yowayowa-sensei", "yowayowa-sensei-"];

    async function ensurePinned(list) {
      list = (list || []).slice();
      const byId = {};
      list.forEach(function (x) { byId[x.id] = x; });
      const pinnedItems = [];
      for (var i = 0; i < PINNED.length; i++) {
        var slug = PINNED[i];
        if (byId[slug]) {
          pinnedItems.push(byId[slug]);
        } else {
          try {
            var hits = await fetchSearch(slug.replace(/-/g, " "));
            var hit = (hits || []).find(function (h) { return h.id === slug; }) || (hits && hits[0]);
            if (hit) {
              hit.id = hit.id || slug;
              pinnedItems.push(hit);
              byId[hit.id] = hit;
            } else {
              // minimal placeholder so order stays
              pinnedItems.push({
                id: slug,
                title: slug.split("-").map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" "),
                type: "SERIES",
                poster: "",
                langs: ["English"]
              });
            }
          } catch (e) {}
        }
      }
      var rest = list.filter(function (x) {
        return PINNED.indexOf(x.id) === -1;
      });
      return pinnedItems.concat(rest);
    }

    function filterHero(list) {
      return (list || []).filter(function (x) {
        var id = (x.id || "").toLowerCase();
        for (var i = 0; i < HIDE_FROM_HERO.length; i++) {
          if (id.indexOf(HIDE_FROM_HERO[i]) !== -1) return false;
        }
        return true;
      });
    }

    var baseTrending = sections.trending && sections.trending.items
      ? sections.trending.items
      : (sections.newAnime && sections.newAnime.items) || (sections.onAir && sections.onAir.items) || [];
    baseTrending = await ensurePinned(baseTrending);
    // Remove Yowayowa Sensei from trending/home rows (still searchable via API elsewhere)
    baseTrending = baseTrending.filter(function (x) {
      var id = (x.id || "").toLowerCase();
      var title = (x.title || "").toLowerCase();
      return id.indexOf("yowayowa") === -1 && title.indexOf("yowayowa") === -1;
    });
    baseTrending = assignCategories(baseTrending);

    const heroItems = filterHero(baseTrending).slice(0, 5);
    // ensure solo-leveling is first in hero if present
    heroItems.sort(function (a, b) {
      if (a.id === "solo-leveling") return -1;
      if (b.id === "solo-leveling") return 1;
      return 0;
    });

    if (slidesEl && heroItems.length) {
      let current = 0;
      slidesEl.innerHTML = heroItems
        .map(
          (s, i) => `
        <div class="hero-slide ${i === 0 ? "active" : ""}" style="background-image:url('${(s.poster || "").replace("/w500/", "/w1280/")}')">
          <div class="hero-content">
            <div class="hero-info">
              <div class="hero-tags">
                <span class="hero-tag">${s.type || "SERIES"}</span>
                <span class="hero-tag accent">English</span>
              </div>
              <h1 class="hero-title">${escapeHtml(s.title)}</h1>
              <p class="hero-desc">Watch now. Live from cloud.</p>
              <div class="hero-actions">
                <a href="anime.html?id=${encodeURIComponent(s.id)}" class="btn btn-primary">▶ Watch Now</a>
                <a href="anime.html?id=${encodeURIComponent(s.id)}" class="btn btn-ghost">Details</a>
              </div>
            </div>
          </div>
        </div>`
        )
        .join("");

      const dotsEl = document.getElementById("heroDots");
      if (dotsEl) {
        dotsEl.innerHTML = heroItems
          .map((_, i) => `<button class="hero-dot ${i === 0 ? "active" : ""}" data-i="${i}"></button>`)
          .join("");
        dotsEl.querySelectorAll(".hero-dot").forEach((d) => {
          d.addEventListener("click", () => goTo(+d.dataset.i));
        });
      }

      function goTo(i) {
        current = i;
        slidesEl.querySelectorAll(".hero-slide").forEach((s, idx) => s.classList.toggle("active", idx === i));
        dotsEl?.querySelectorAll(".hero-dot").forEach((d, idx) => d.classList.toggle("active", idx === i));
      }
      document.getElementById("heroPrev")?.addEventListener("click", () =>
        goTo((current - 1 + heroItems.length) % heroItems.length)
      );
      document.getElementById("heroNext")?.addEventListener("click", () =>
        goTo((current + 1) % heroItems.length)
      );
      setInterval(() => goTo((current + 1) % heroItems.length), 7000);
    }

    if (trendingEl) {
      const list = mergeCatalogForSection(baseTrending, "trending");
      trendingEl.innerHTML = list.length ? list.map(createCard).join("") : `<p style="color:var(--text-muted)">Could not load.</p>`;
    }
    if (moviesEl) {
      const list = assignCategories(mergeCatalogForSection(sections.movies?.items || sections.cartoonMovies?.items || [], "movies"));
      moviesEl.innerHTML = list.length ? list.map(createCard).join("") : "";
    }
    if (topEl) {
      const list = assignCategories(mergeCatalogForSection(sections.onAir?.items || sections.trending?.items || [], "topRated"));
      topEl.innerHTML = list.slice(0, 10).map(createCard).join("");
    }
    if (cartoonsEl) {
      const list = assignCategories(mergeCatalogForSection(sections.cartoons?.items || sections.cartoonMovies?.items || [], "cartoons"));
      cartoonsEl.innerHTML = list.length ? list.map(createCard).join("") : "";
    }
    if (continueEl) {
      const watched = JSON.parse(localStorage.getItem("ap-continue") || "[]");
      if (watched.length) {
        continueEl.innerHTML = watched.slice(0, 8).map(createContinueCard).join("");
      } else {
        var start = heroItems.find(function(x){ return x.id === "solo-leveling"; }) || heroItems[0];
        if (start) continueEl.innerHTML = createContinueCard(Object.assign({}, start, { ep: "Start watching", progress: 5 }));
      }
    }
  }

  // ========== BROWSE ==========
  async function initBrowse() {
    try { if (typeof loadPublicOverrides === 'function') await loadPublicOverrides(); } catch (e) {}
    const catalogGrid = document.getElementById("catalogGrid");
    if (!catalogGrid) return;

    const params = new URLSearchParams(location.search);
    let typeFilter = params.get("type") || "all";
    const resultsCount = document.getElementById("resultsCount");
    const browseSearch = document.getElementById("browseSearch");
    const typeTabs = document.querySelectorAll(".type-tab");

    showLoading(catalogGrid, "Loading full catalog…");
    let apiItems = [];
    var seenBrowse = {};
    function pushBrowse(arr) {
      (arr || []).forEach(function (i) {
        if (!i || !i.id || seenBrowse[i.id]) return;
        seenBrowse[i.id] = true;
        apiItems.push(i);
      });
    }
    /* Full index (same as admin) */
    try {
      var idxRes = await fetch("catalog-index.json", { cache: "no-store" });
      if (idxRes.ok) {
        var idx = await idxRes.json();
        var raw = (idx && idx.items) ? idx.items : (Array.isArray(idx) ? idx : []);
        pushBrowse(raw.map(function (x) {
          return {
            id: x.id || x.slug,
            title: x.title || x.id,
            type: x.type || "SERIES",
            poster: x.poster || x.image || "",
            url: x.url || "",
            langs: x.langs || ["Japanese"]
          };
        }));
      }
    } catch (e) {}
    try {
      const homeData = await fetchHome();
      const sections = mapHomeSections(homeData);
      Object.values(sections).forEach((s) => { pushBrowse(s.items || []); });
    } catch (e) {}
    let allItems = assignCategories(mergeCatalog(apiItems));
    let fullCatalog = allItems.slice(); /* search resets to this, not API-only 12 */
    let langFilter = "ALL";
    let categoryFilter = "ALL";

    function render(list) {
      if (resultsCount) resultsCount.textContent = list.length + " results";
      catalogGrid.innerHTML =
        list.map(createCard).join("") ||
        `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px">No titles found.</p>`;
    }

    function applyFilters(q) {
      let list = [...allItems];
      if (typeFilter === "series") list = list.filter((a) => a.type === "SERIES");
      if (typeFilter === "movies") list = list.filter((a) => a.type === "MOVIE");
      
      if (categoryFilter !== "ALL") {
        var cf = categoryFilter.toLowerCase();
        list = list.filter(function (a) {
          var cat = (a.category || "").toLowerCase();
          if (cat === cf) return true;
          if ((a.genres || []).some(function (g) { return String(g).toLowerCase() === cf; })) return true;
          return false;
        });
      }
      if (q) list = list.filter((a) => a.title.toLowerCase().includes(q));
      render(list);
    }

    document.querySelectorAll("[data-lang]").forEach((c) => {
      c.addEventListener("click", () => {
        document.querySelectorAll("[data-lang]").forEach((x) => x.classList.remove("active"));
        c.classList.add("active");
        langFilter = c.dataset.lang;
        applyFilters(browseSearch?.value.trim().toLowerCase() || "");
      });
    });

    document.querySelectorAll("[data-category]").forEach((c) => {
      c.addEventListener("click", () => {
        document.querySelectorAll("[data-category]").forEach((x) => x.classList.remove("active"));
        c.classList.add("active");
        categoryFilter = c.dataset.category;
        applyFilters(browseSearch?.value.trim().toLowerCase() || "");
      });
    });

    typeTabs.forEach((t) => {
      if (t.dataset.type === typeFilter) t.classList.add("active");
      t.addEventListener("click", () => {
        typeTabs.forEach((x) => x.classList.remove("active"));
        t.classList.add("active");
        typeFilter = t.dataset.type;
        history.replaceState(null, "", typeFilter === "all" ? "browse.html" : `browse.html?type=${typeFilter}`);
        applyFilters(browseSearch?.value.trim().toLowerCase() || "");
      });
    });

    let browseTimer;
    browseSearch?.addEventListener("input", () => {
      clearTimeout(browseTimer);
      const q = browseSearch.value.trim();
      if (!q) {
        allItems = fullCatalog.slice();
        applyFilters("");
        return;
      }
      /* Local full-catalog filter (fast) — API search optional top-up */
      browseTimer = setTimeout(async () => {
        allItems = fullCatalog.slice();
        applyFilters(q.toLowerCase());
        if (q.length >= 2) {
          try {
            const hits = await fetchSearch(q);
            if (hits && hits.length) {
              var seen = {};
              allItems.forEach(function (x) { seen[x.id] = true; });
              hits.forEach(function (h) {
                if (h && h.id && !seen[h.id]) { seen[h.id] = true; allItems.push(h); }
              });
              allItems = assignCategories(allItems);
              applyFilters(q.toLowerCase());
            }
          } catch (e) {}
        }
      }, 250);
    });

    document.querySelectorAll("[data-letter]").forEach((c) => {
      c.addEventListener("click", () => {
        document.querySelectorAll("[data-letter]").forEach((x) => x.classList.remove("active"));
        c.classList.add("active");
        const letter = c.dataset.letter;
        allItems = fullCatalog.slice();
        let list = [...allItems];
        if (typeFilter === "series") list = list.filter((a) => a.type === "SERIES");
        if (typeFilter === "movies") list = list.filter((a) => a.type === "MOVIE");
        if (letter && letter !== "ALL") {
          if (letter === "#") list = list.filter((a) => !/^[A-Za-z]/.test(a.title || ""));
          else list = list.filter((a) => (a.title || "").charAt(0).toUpperCase() === letter);
        }
        if (resultsCount) resultsCount.textContent = list.length + " results";
        catalogGrid.innerHTML =
          list.map(createCard).join("") ||
          `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px">No titles found.</p>`;
      });
    });

    applyFilters("");
  }

  // ========== ANIME DETAIL ==========
  async function initAnimeDetail() {
    const detailRoot = document.getElementById("animeDetail");
    if (!detailRoot) return;

    let id = new URLSearchParams(location.search).get("id") || "solo-leveling";
    const manualHit = getManualCatalog().find((m) => m.id === id);
    if (manualHit?.apiSlug) id = manualHit.apiSlug;
    detailRoot.innerHTML = `
      <div style="padding:48px;text-align:center;color:var(--text-muted)">
        <div style="margin:0 auto 16px;width:40px;height:40px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite"></div>
        Loading anime from cloud…
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;

    let data = await fetchAnime(id);
    const manual = getManualCatalog().find((m) => m.id === id || m.apiSlug === id || m.id === new URLSearchParams(location.search).get("id"));
    if (!data && manual) {
      data = {
        id: manual.apiSlug || manual.id,
        title: manual.title,
        description: manual.description || "Added from admin panel.",
        genres: (manual.categories && manual.categories.length) ? manual.categories : (manual.category ? [manual.category] : []),
        poster: manual.poster || "",
        isMovie: manual.type === "MOVIE",
        type: manual.type || "SERIES",
        episodes: manual.seasons ? manualEpisodes(manual) : [],
        manualServers: manual.servers || null
      };
    }
    if (!data) {
      detailRoot.innerHTML = `
        <div style="padding:48px;text-align:center">
          <p style="color:var(--text-muted);margin-bottom:16px">Could not load this title. Check slug or add via Admin.</p>
          <a href="browse.html" class="btn btn-primary" style="color:#fff">← Back to Catalog</a>
        </div>`;
      return;
    }
    if (manual && manual.description && !data.description) data.description = manual.description;
    if (manual && manual.poster && !data.poster) data.poster = manual.poster;
    // Prefer fully manual episode list when seasons exist
    if (manual && manual.seasons && Object.keys(manual.seasons).length) {
      data.episodes = manualEpisodes(manual);
      data.isMovie = false;
      data.type = "SERIES";
    }
    if (manual && manual.type === "MOVIE" && manual.servers) {
      data.isMovie = true;
      data.manualServers = manual.servers;
      data.episodes = [];
    }


    // Merge manually added episodes (from overrides) into list for this anime
    try {
      if (typeof loadPublicOverrides === "function") await loadPublicOverrides();
      var ov = (typeof getEpOverrides === "function") ? getEpOverrides() : {};
      // Normalize both sides to the same slug shape (lowercase, hyphenated)
      // before comparing — this makes older override IDs saved with the
      // display title ("Re Zero - Starting...") instead of the real slug
      // ("re-zero-starting-...") still match correctly, no re-saving needed.
      function slugForMatch(s) {
        return String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      var animeIdLower = slugForMatch(data.id || id || "");
      Object.keys(ov).forEach(function (epKey) {
        var m = String(epKey).match(/^(.*)-(\d+)x(\d+)$/);
        if (!m) return;
        var base = slugForMatch(m[1]);
        if (base !== animeIdLower && animeIdLower.indexOf(base) === -1 && base.indexOf(animeIdLower) === -1) return;
        var season = m[2], num = parseInt(m[3], 10);
        var exists = (data.episodes || []).some(function (e) {
          return String(e.id) === epKey || (String(e.season) === String(season) && Number(e.number) === num);
        });
        if (exists) return;
        data.episodes = data.episodes || [];
        data.episodes.push({
          id: epKey,
          number: num,
          season: season,
          title: (ov[epKey].title || ov[epKey].note || ("Episode " + num)),
          thumbnail: ov[epKey].thumbnail || ""
        });
      });
      // sort
      data.episodes.sort(function (a, b) {
        var sa = Number(a.season) || 1, sb = Number(b.season) || 1;
        if (sa !== sb) return sa - sb;
        return (Number(a.number) || 0) - (Number(b.number) || 0);
      });
    } catch (e) {}

    // Audio language badges (computed after public overrides are loaded)
    var audioLangs = (manual && manual.audioLangs && manual.audioLangs.length)
      ? manual.audioLangs
      : ((typeof getAudioLangsFor === "function") ? getAudioLangsFor(data.id || id) : ["Hindi", "Urdu", "Japanese"]);

    const seasons = {};
    data.episodes.forEach((e) => {
      const s = e.season || "1";
      if (!seasons[s]) seasons[s] = [];
      seasons[s].push(e);
    });
    const seasonKeys = Object.keys(seasons).sort((a, b) => +a - +b);

    detailRoot.innerHTML = `
      <div class="detail-hero">
        <div class="detail-poster">
          <img src="${data.poster}" alt="${escapeHtml(data.title)}"
            onerror="this.parentElement.innerHTML='<div class=\\'placeholder-poster\\'>🎌</div>'" />
        </div>
        <div class="detail-info">
          <h1>${escapeHtml(data.title)}</h1>
          <div class="detail-genres">
            ${(data.genres || []).map((g) => `<span class="genre-chip">${escapeHtml(g)}</span>`).join("") ||
              `<span class="genre-chip">${data.type}</span>`}
          </div>
          <div class="audio-langs">
            <h3>Available Audio Languages:</h3>
            <div class="audio-badges">${audioLangs.map((l) => `<span class="audio-badge">${escapeHtml(l)}</span>`).join("")}</div>
          </div>
          <div class="overview">
            <h3>Overview</h3>
            <p>${escapeHtml(data.description || "No description available.")}</p>
          </div>
          <a href="browse.html" class="btn btn-primary" style="color:#fff">← Back to Catalog</a>
          ${data.isMovie || (data.episodes && data.episodes.length === 0 && data.moviePlayers) ? `<a href="watch.html?id=${encodeURIComponent(data.id)}&movie=1" class="btn btn-primary" style="color:#fff;margin-left:8px">▶ Watch Movie</a>` : ""}
        </div>
      </div>
      <div class="episodes-section">
        <div class="episodes-header">
          <div class="season-tabs" id="seasonTabs">
            <button class="season-tab active" data-s="all">All Seasons</button>
            ${seasonKeys.map((s) => `<button class="season-tab" data-s="${s}">Season ${s}</button>`).join("")}
          </div>
          <span class="ep-count" id="epCount">${data.episodes.length} EPISODES</span>
        </div>
        <div class="episodes-grid" id="episodesGrid"></div>
      </div>`;

    detailRoot.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        detailRoot.querySelectorAll(".lang-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    let currentSeason = "all";
    const grid = document.getElementById("episodesGrid");
    const epCount = document.getElementById("epCount");

    function renderEps() {
      const eps = currentSeason === "all" ? data.episodes : seasons[currentSeason] || [];
      epCount.textContent = `${eps.length} EPISODES`;
      grid.innerHTML = eps
        .map(
          (e) => `
        <a href="watch.html?id=${encodeURIComponent(data.id)}&ep=${encodeURIComponent(e.id)}" class="ep-card">
          <div class="ep-thumb">
            ${e.thumbnail
              ? `<img src="${e.thumbnail}" alt="" loading="lazy" onerror="this.style.display='none'" />`
              : `<div class="placeholder-poster" style="font-size:1.4rem">▶</div>`}
            <div class="ep-play"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
          </div>
          <div class="ep-info">
            <div class="ep-num">S${e.season} E${e.number}</div>
            <div class="ep-title">${escapeHtml(e.title)}</div>
          </div>
        </a>`
        )
        .join("");
    }

    document.querySelectorAll(".season-tab").forEach((t) => {
      t.addEventListener("click", () => {
        document.querySelectorAll(".season-tab").forEach((x) => x.classList.remove("active"));
        t.classList.add("active");
        currentSeason = t.dataset.s;
        renderEps();
      });
    });
    renderEps();
    if ((!data.episodes || !data.episodes.length) && (data.isMovie || data.moviePlayers)) {
      const grid = document.getElementById("episodesGrid");
      if (grid) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:24px">
          <a href="watch.html?id=${encodeURIComponent(data.id)}&movie=1" class="btn btn-primary" style="color:#fff;font-size:1.1rem;padding:14px 28px">▶ Watch Movie</a>
        </div>`;
      }
    }
  }


  // ========== WATCH ==========
  async function initWatch() {
    const playerRoot = document.getElementById("playerRoot");
    if (!playerRoot) return;

    const params = new URLSearchParams(location.search);
    const animeId = params.get("id") || "";
    const epId = params.get("ep") || "";
    const isMovieWatch = params.get("movie") === "1" || (!epId && animeId);

    playerRoot.innerHTML = `
      <div style="padding:60px;text-align:center;color:var(--text-muted)">
        <div style="margin:0 auto 16px;width:40px;height:40px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite"></div>
        Loading stream…
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;

    let anime = animeId ? await fetchAnime(animeId) : null;
    const manualOnly = getManualCatalog().find(function(m){ return m.id === animeId; });
    if (!anime && manualOnly) {
      anime = {
        id: manualOnly.id,
        title: manualOnly.title,
        poster: manualOnly.poster,
        isMovie: manualOnly.type === "MOVIE",
        manualServers: manualOnly.servers || null,
        type: manualOnly.type
      };
    } else if (anime && manualOnly && manualOnly.servers) {
      anime.manualServers = manualOnly.servers;
    } else if (anime && manualOnly && manualOnly.seasons) {
      // ok
    }

    let videoSrc = null;
    let nextId = null;
    let prevId = null;
    let langButtons = "";

    if (anime && anime.isMovie) {
      // Prefer as-cdn main player (same as series). short.icu links often fail in iframe.
      const ms = anime.movieStream;
      if (ms) {
        videoSrc = ms.main || ms.multiPage;
      }
      if (!videoSrc && anime.moviePlayers && anime.moviePlayers.length) {
        videoSrc = anime.moviePlayers.find(function(p){ return p && p.indexOf("as-cdn") !== -1 && (typeof isSafeEmbedLink !== "function" || isSafeEmbedLink(p)); }) || anime.moviePlayers.find(function(p){ return typeof isSafeEmbedLink !== "function" || isSafeEmbedLink(p); }) || anime.moviePlayers[0];
      }
      // Server options: CDN + multi-lang page
      var opts = [];
      if (ms && ms.main) opts.push({ language: ms.preferredLang ? ("🎧 " + ms.preferredLang) : "Server 1 (CDN)", link: ms.main });
      if (ms && ms.multiPage) opts.push({ language: "Server 2 (Multi-lang)", link: ms.multiPage });
      if (opts.length) {
        langButtons = opts.map(function(l, idx) {
          var active = idx === 0 ? " active" : "";
          return '<button class="lang-btn' + active + '" data-link="' + (l.link || "") + '">' + l.language + "</button>";
        }).join("");
      }
    } else if (epId) {
      const stream = await fetchEpisode(epId);
      if (stream) {
        videoSrc = stream.m3u8 || stream.videoPlayer;
        nextId = stream.nextId;
        prevId = stream.prevId;
        if (stream.servers) {
          var srv = stream.servers;
          var epLangs = stream.langs || {};
          var opts = [];
          var keys = ["s1", "s2", "s3"];
          var defaultLabels = { s1: "Server 1 (CDN)", s2: "Server 2", s3: "Server 3" };
          keys.forEach(function (k) {
            if (!srv[k]) return;
            var label = epLangs[k] ? ("🎧 " + epLangs[k]) : defaultLabels[k];
            opts.push({ key: k, language: label, link: srv[k] });
          });
          if (opts.length) {
            // Auto-play Hindi (or next best per LANG_PRIORITY) when tagged, otherwise Server 1
            var activeIdx = 0;
            if (stream.preferredKey) {
              var pi = opts.findIndex(function (o) { return o.key === stream.preferredKey; });
              if (pi !== -1) activeIdx = pi;
            }
            langButtons = opts.map(function(l, idx) {
              var active = idx === activeIdx ? " active" : "";
              return '<button class="lang-btn' + active + '" data-link="' + String(l.link).replace(/"/g, "&quot;") + '">' + l.language + "</button>";
            }).join("");
            videoSrc = opts[activeIdx].link;
          }
        }
      }
    }

    // Manual movie servers
    if (anime && anime.isMovie && anime.manualServers) {
      var ms2 = anime.manualServers;
      var opts2 = [];
      if (ms2.s1) opts2.push({ language: "Server 1", link: ms2.s1 });
      if (ms2.s2) opts2.push({ language: "Server 2", link: ms2.s2 });
      if (ms2.s3) opts2.push({ language: "Server 3", link: ms2.s3 });
      if (opts2.length) {
        videoSrc = videoSrc || opts2[0].link;
        langButtons = opts2.map(function(l, idx) {
          return '<button class="lang-btn' + (idx===0?' active':'') + '" data-link="' + l.link + '">' + l.language + "</button>";
        }).join("");
      }
    }

    if (!videoSrc) {
      playerRoot.innerHTML = `
        <div style="padding:48px;text-align:center">
          <p style="margin-bottom:12px;color:var(--text-muted)">Stream not available for this title.</p>
          <a href="anime.html?id=${encodeURIComponent(animeId)}" class="btn btn-primary" style="color:#fff">← Back</a>
        </div>`;
      return;
    }

    if (anime) {
      const cont = JSON.parse(localStorage.getItem("ap-continue") || "[]").filter((x) => x.id !== anime.id);
      cont.unshift({ id: anime.id, title: anime.title, poster: anime.poster, ep: epId || "movie", progress: 15 });
      localStorage.setItem("ap-continue", JSON.stringify(cont.slice(0, 12)));
    }

    const isIframe = videoSrc && !/\.m3u8|\.mp4/i.test(videoSrc);

    // Recommended from home
    let recHtml = "";
    try {
      const homeData = await fetchHome();
      const sections = mapHomeSections(homeData);
      const rec = mergeCatalog(
        (sections.trending && sections.trending.items) ||
        (sections.newAnime && sections.newAnime.items) ||
        []
      ).filter((x) => x.id !== animeId).slice(0, 12);
      if (rec.length) {
        recHtml = `
        <section class="section" style="padding-top:32px">
          <div class="section-header">
            <h2 class="section-title">Recommended Series</h2>
          </div>
          <div class="cards-row">${rec.map(createCard).join("")}</div>
        </section>`;
      }
    } catch (e) {}

    playerRoot.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px">
        <div>
          <a href="anime.html?id=${encodeURIComponent(animeId)}" style="color:var(--primary);font-weight:600;font-size:0.9rem">← Episodes List</a>
          <h1 style="font-size:1.4rem;margin-top:6px">${escapeHtml(anime && anime.title ? anime.title : animeId)}</h1>
          <p style="color:var(--text-secondary);font-size:0.9rem">${escapeHtml(epId || (anime && anime.isMovie ? "Movie" : ""))}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${prevId ? `<a class="btn" style="background:var(--bg-card);color:var(--text);border:1px solid var(--border);padding:10px 16px;border-radius:999px;font-weight:600" href="watch.html?id=${encodeURIComponent(animeId)}&ep=${encodeURIComponent(prevId)}">‹ Prev</a>` : ""}
          ${nextId ? `<a class="btn btn-primary" style="color:#fff" href="watch.html?id=${encodeURIComponent(animeId)}&ep=${encodeURIComponent(nextId)}">Next ›</a>` : ""}
        </div>
      </div>
      ${langButtons ? `<div class="lang-btns" id="movieLangs" style="margin-bottom:12px">${langButtons}</div>` : ""}
      <div id="playerFrame" style="background:#000;border-radius:var(--radius);overflow:hidden;aspect-ratio:16/9;border:1px solid var(--border)">
        ${isIframe
          ? `<iframe id="vidFrame" src="${videoSrc}" allowfullscreen allow="autoplay; fullscreen" style="width:100%;height:100%;border:0"></iframe>`
          : `<video id="vidEl" controls autoplay playsinline style="width:100%;height:100%" src="${videoSrc}"></video>`}
      </div>
      <p style="margin-top:12px;font-size:0.8rem;color:var(--text-muted)">Use the player menu to change quality or audio if available.</p>
      ${recHtml}`;

    // Movie language buttons
    document.querySelectorAll("#movieLangs .lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#movieLangs .lang-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const link = btn.getAttribute("data-link");
        if (!link) return;
        const frame = document.getElementById("vidFrame");
        const vid = document.getElementById("vidEl");
        if (frame) frame.src = link;
        else if (vid) vid.src = link;
      });
    });
  }


  initHome();
  initBrowse();
  initAnimeDetail();
  initWatch();

  // Bottom nav active state + search
  (function () {
    var path = location.pathname + location.search;
    var page = "home";
    if (path.indexOf("browse") !== -1) {
      page = path.indexOf("type=movies") !== -1 ? "movies" : path.indexOf("type=series") !== -1 ? "series" : "series";
    } else if (path.indexOf("watch") !== -1 || path.indexOf("anime") !== -1) {
      page = "series";
    }
    document.querySelectorAll(".bottom-nav a").forEach(function (a) {
      if (a.dataset.nav === page) a.classList.add("active");
    });
    var bs = document.getElementById("bottomSearch");
    if (bs) {
      bs.addEventListener("click", function (e) {
        e.preventDefault();
        var modal = document.getElementById("searchModal");
        var input = document.getElementById("searchInput");
        if (modal) {
          modal.classList.add("open");
          if (input) setTimeout(function () { input.focus(); }, 100);
        } else {
          location.href = "browse.html";
        }
      });
    }
  })();

})();
