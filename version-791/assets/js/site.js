(function () {
  "use strict";

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function initMobileNavigation() {
    var toggle = qs(".menu-toggle");
    var panel = qs(".mobile-panel");

    if (!toggle || !panel) {
      return;
    }

    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      panel.hidden = isOpen;
    });
  }

  function initSearchForms() {
    qsa(".header-search, .mobile-search, .hero-search").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = qs('input[name="q"]', form);
        var query = input ? input.value.trim() : "";
        var target = form.getAttribute("data-search-target") || "videos.html";
        var url = query ? target + "?q=" + encodeURIComponent(query) : target;
        window.location.href = url;
      });
    });
  }

  function initHeroCarousel() {
    var carousel = qs(".hero-carousel");

    if (!carousel) {
      return;
    }

    var slides = qsa(".hero-slide", carousel);
    var dots = qsa("[data-hero-dot]", carousel);
    var prev = qs("[data-hero-prev]", carousel);
    var next = qs("[data-hero-next]", carousel);
    var index = 0;
    var timer = null;

    function showSlide(nextIndex) {
      if (!slides.length) {
        return;
      }

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
        showSlide(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        showSlide(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        showSlide(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        showSlide(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    showSlide(0);
    start();
  }

  function initFilters() {
    var panel = qs(".filter-panel");
    var grid = qs(".filter-grid-target");

    if (!panel || !grid) {
      return;
    }

    var controls = qsa("[data-filter]", panel);
    var items = qsa(".filter-item", grid);
    var count = qs("[data-result-count]", panel);
    var reset = qs("[data-reset-filter]", panel);
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q") || "";
    var initialSort = params.get("sort") || "";

    var keywordInput = qs('[data-filter="keyword"]', panel);
    var sortSelect = qs('[data-filter="sort"]', panel);

    if (keywordInput && initialQuery) {
      keywordInput.value = initialQuery;
    }

    if (sortSelect && initialSort) {
      sortSelect.value = initialSort;
    }

    function getValue(name) {
      var control = qs('[data-filter="' + name + '"]', panel);
      return control ? normalize(control.value) : "";
    }

    function itemText(item) {
      return normalize([
        item.getAttribute("data-title"),
        item.getAttribute("data-year"),
        item.getAttribute("data-region"),
        item.getAttribute("data-type"),
        item.getAttribute("data-genre"),
        item.getAttribute("data-tags"),
        item.getAttribute("data-category")
      ].join(" "));
    }

    function applySort(sortValue) {
      var sorted = items.slice();

      if (sortValue === "views-desc") {
        sorted.sort(function (a, b) {
          return Number(b.getAttribute("data-views") || 0) - Number(a.getAttribute("data-views") || 0);
        });
      } else if (sortValue === "year-desc") {
        sorted.sort(function (a, b) {
          return normalize(b.getAttribute("data-year")).localeCompare(normalize(a.getAttribute("data-year")), "zh-Hans-CN");
        });
      } else if (sortValue === "title-asc") {
        sorted.sort(function (a, b) {
          return normalize(a.getAttribute("data-title")).localeCompare(normalize(b.getAttribute("data-title")), "zh-Hans-CN");
        });
      }

      sorted.forEach(function (item) {
        grid.appendChild(item);
      });
    }

    function applyFilters() {
      var keyword = getValue("keyword");
      var region = getValue("region");
      var type = getValue("type");
      var year = getValue("year");
      var category = getValue("category");
      var sortValue = getValue("sort");
      var visibleCount = 0;

      applySort(sortValue);

      items.forEach(function (item) {
        var text = itemText(item);
        var matches = true;

        if (keyword && text.indexOf(keyword) === -1) {
          matches = false;
        }

        if (region && normalize(item.getAttribute("data-region")) !== region) {
          matches = false;
        }

        if (type && normalize(item.getAttribute("data-type")) !== type) {
          matches = false;
        }

        if (year && normalize(item.getAttribute("data-year")) !== year) {
          matches = false;
        }

        if (category && normalize(item.getAttribute("data-category")) !== category) {
          matches = false;
        }

        item.classList.toggle("is-hidden-by-filter", !matches);

        if (matches) {
          visibleCount += 1;
        }
      });

      if (count) {
        count.textContent = String(visibleCount);
      }
    }

    controls.forEach(function (control) {
      control.addEventListener("input", applyFilters);
      control.addEventListener("change", applyFilters);
    });

    if (reset) {
      reset.addEventListener("click", function () {
        controls.forEach(function (control) {
          control.value = control.getAttribute("data-filter") === "sort" ? "default" : "";
        });
        applyFilters();
      });
    }

    applyFilters();
  }

  function initMoviePlayer() {
    qsa(".player-card").forEach(function (card) {
      var video = qs("video", card);
      var button = qs(".play-overlay", card);
      var message = qs(".player-message", card);
      var source = card.getAttribute("data-video-src");
      var hlsInstance = null;

      if (!video || !button || !source) {
        return;
      }

      function setMessage(text) {
        if (message) {
          message.textContent = text || "";
        }
      }

      function attachSource() {
        if (hlsInstance) {
          return Promise.resolve();
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });

          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);

          return new Promise(function (resolve) {
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
              resolve();
            });
            hlsInstance.on(window.Hls.Events.ERROR, function (_, data) {
              if (data && data.fatal) {
                setMessage("播放线路加载失败，请稍后重试或更换浏览器。 ");
              }
            });
          });
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          return Promise.resolve();
        }

        video.src = source;
        setMessage("当前浏览器可能不支持当前视频线路，建议使用新版 Chrome、Edge 或 Safari。 ");
        return Promise.resolve();
      }

      button.addEventListener("click", function () {
        setMessage("正在连接播放线路...");
        attachSource().then(function () {
          var playPromise = video.play();

          if (playPromise && typeof playPromise.then === "function") {
            playPromise.then(function () {
              card.classList.add("is-playing");
              setMessage("");
            }).catch(function () {
              card.classList.add("is-playing");
              setMessage("播放器已就绪，请点击视频控件继续播放。 ");
            });
          } else {
            card.classList.add("is-playing");
            setMessage("");
          }
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNavigation();
    initSearchForms();
    initHeroCarousel();
    initFilters();
    initMoviePlayer();
  });
}());
