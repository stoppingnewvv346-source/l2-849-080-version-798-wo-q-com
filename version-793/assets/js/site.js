(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function setupFilters() {
    document.querySelectorAll("[data-filter-scope]").forEach(function (scope) {
      var input = scope.querySelector("[data-filter-input]");
      var cards = Array.prototype.slice.call(scope.querySelectorAll(".filter-card"));
      var empty = scope.querySelector(".empty-filter-message");
      if (!input || !cards.length) {
        return;
      }
      input.addEventListener("input", function () {
        var term = input.value.trim().toLowerCase();
        var shown = 0;
        cards.forEach(function (card) {
          var text = card.getAttribute("data-filter") || "";
          var match = !term || text.indexOf(term) !== -1;
          card.hidden = !match;
          if (match) {
            shown += 1;
          }
        });
        if (empty) {
          empty.hidden = shown !== 0;
        }
      });
    });
  }

  function makeSearchCard(item) {
    var tag = item.tags && item.tags.length ? item.tags.slice(0, 3).join("，") : item.genre;
    return [
      '<article class="movie-card filter-card">',
      '<a class="movie-card-link" href="./' + escapeHTML(item.url) + '">',
      '<div class="movie-thumb">',
      '<img src="' + escapeHTML(item.cover) + '" alt="' + escapeHTML(item.title) + '" loading="lazy">',
      '<span class="movie-badge">' + escapeHTML(item.category) + '</span>',
      '<span class="movie-duration">' + escapeHTML(item.duration) + '</span>',
      '<span class="movie-play">▶</span>',
      '</div>',
      '<div class="movie-card-body">',
      '<h3>' + escapeHTML(item.title) + '</h3>',
      '<p>' + escapeHTML(item.description) + '</p>',
      '<div class="movie-meta">',
      '<span>' + escapeHTML(item.region) + '</span>',
      '<span>' + escapeHTML(item.year) + '</span>',
      '<span>' + escapeHTML(tag) + '</span>',
      '</div>',
      '</div>',
      '</a>',
      '</article>'
    ].join("");
  }

  function setupSearchPage() {
    var results = document.querySelector("[data-search-results]");
    var input = document.querySelector("[data-search-page-input]");
    var status = document.querySelector("[data-search-status]");
    if (!results || !input || !window.MOVIE_SEARCH_DATA) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    input.value = params.get("q") || "";

    function render() {
      var term = input.value.trim().toLowerCase();
      var data = window.MOVIE_SEARCH_DATA.filter(function (item) {
        if (!term) {
          return true;
        }
        return item.text.indexOf(term) !== -1;
      });
      results.innerHTML = data.map(makeSearchCard).join("");
      if (status) {
        status.textContent = term ? "搜索结果：" + data.length + " 部" : "热门片库";
      }
    }

    input.addEventListener("input", render);
    render();
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupSearchPage();
  });
})();
