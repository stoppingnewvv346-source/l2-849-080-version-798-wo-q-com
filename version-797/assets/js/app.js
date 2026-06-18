(function () {
  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function text(value) {
    return String(value || "").toLowerCase().trim();
  }

  function setupMobileNav() {
    var toggle = qs("[data-mobile-toggle]");
    var panel = qs("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupCarousel() {
    qsa("[data-carousel]").forEach(function (carousel) {
      var slides = qsa("[data-carousel-slide]", carousel);
      var dots = qsa("[data-carousel-dot]", carousel);
      var prev = qs("[data-carousel-prev]", carousel);
      var next = qs("[data-carousel-next]", carousel);
      var index = 0;
      var timer = null;

      if (!slides.length) {
        return;
      }

      function show(nextIndex) {
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle("active", i === index);
          slide.setAttribute("aria-hidden", i === index ? "false" : "true");
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle("active", i === index);
        });
      }

      function restart() {
        if (timer) {
          window.clearInterval(timer);
        }
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5800);
      }

      if (prev) {
        prev.addEventListener("click", function () {
          show(index - 1);
          restart();
        });
      }

      if (next) {
        next.addEventListener("click", function () {
          show(index + 1);
          restart();
        });
      }

      dots.forEach(function (dot, i) {
        dot.addEventListener("click", function () {
          show(i);
          restart();
        });
      });

      show(0);
      restart();
    });
  }

  function setupFilters() {
    qsa("[data-filter-root]").forEach(function (root) {
      var input = qs("[data-search-input]", root);
      var clear = qs("[data-clear-search]", root);
      var type = qs("[data-filter-type]", root);
      var region = qs("[data-filter-region]", root);
      var year = qs("[data-filter-year]", root);
      var cards = qsa("[data-search-card]", root);
      var empty = qs("[data-empty-result]", root);

      if (!cards.length) {
        cards = qsa("[data-search-card]");
      }

      function apply() {
        var keyword = text(input && input.value);
        var typeValue = text(type && type.value);
        var regionValue = text(region && region.value);
        var yearValue = text(year && year.value);
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = text([
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-type"),
            card.getAttribute("data-year"),
            card.getAttribute("data-genre"),
            card.getAttribute("data-tags")
          ].join(" "));
          var ok = true;
          if (keyword && haystack.indexOf(keyword) === -1) {
            ok = false;
          }
          if (typeValue && text(card.getAttribute("data-type")) !== typeValue) {
            ok = false;
          }
          if (regionValue && text(card.getAttribute("data-region")) !== regionValue) {
            ok = false;
          }
          if (yearValue && text(card.getAttribute("data-year")) !== yearValue) {
            ok = false;
          }
          card.hidden = !ok;
          if (ok) {
            visible += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }

      [input, type, region, year].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });

      if (clear && input) {
        clear.addEventListener("click", function () {
          input.value = "";
          apply();
        });
      }

      apply();
    });
  }

  window.setupMoviePlayer = function (source) {
    var video = document.getElementById("moviePlayer");
    var button = document.getElementById("playerStart");
    var hlsInstance = null;

    if (!video || !button || !source) {
      return;
    }

    function attachSource() {
      if (video.getAttribute("data-ready") === "1") {
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal && hlsInstance) {
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hlsInstance.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hlsInstance.recoverMediaError();
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else {
        video.src = source;
      }

      video.setAttribute("data-ready", "1");
    }

    function startPlayback() {
      attachSource();
      button.classList.add("is-hidden");
      video.controls = true;
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          button.classList.remove("is-hidden");
        });
      }
    }

    button.addEventListener("click", startPlayback);
    video.addEventListener("click", function () {
      if (video.getAttribute("data-ready") !== "1") {
        startPlayback();
      }
    });

    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileNav();
    setupCarousel();
    setupFilters();
  });
})();
