(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var button = document.querySelector("[data-menu-button]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (button && nav) {
      button.addEventListener("click", function () {
        nav.classList.toggle("is-open");
      });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-hero-tab]"));
    if (slides.length && tabs.length) {
      var current = 0;
      var timer = null;
      function show(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle("is-active", i === current);
        });
        tabs.forEach(function (tab, i) {
          tab.classList.toggle("is-active", i === current);
        });
      }
      function start() {
        window.clearInterval(timer);
        timer = window.setInterval(function () {
          show(current + 1);
        }, 5200);
      }
      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () {
          show(i);
          start();
        });
      });
      show(0);
      start();
    }

    var filters = Array.prototype.slice.call(document.querySelectorAll("[data-filter-input]"));
    filters.forEach(function (input) {
      var targetSelector = input.getAttribute("data-filter-target") || "[data-card]";
      var cards = Array.prototype.slice.call(document.querySelectorAll(targetSelector));
      var empty = document.querySelector(input.getAttribute("data-empty-target") || "[data-empty-result]");
      function apply() {
        var query = input.value.trim().toLowerCase();
        var visible = 0;
        cards.forEach(function (card) {
          var text = (card.getAttribute("data-search") || card.textContent || "").toLowerCase();
          var ok = !query || text.indexOf(query) !== -1;
          card.style.display = ok ? "" : "none";
          if (ok) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }
      input.addEventListener("input", apply);
      apply();
    });
  });

  window.initPlayer = function (videoId, buttonId, overlayId, sourceUrl) {
    var video = document.getElementById(videoId);
    var button = document.getElementById(buttonId);
    var overlay = document.getElementById(overlayId);
    if (!video || !button || !overlay || !sourceUrl) {
      return;
    }
    var attached = false;
    var hls = null;
    function attach() {
      if (attached) {
        return;
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true });
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
      } else {
        video.src = sourceUrl;
      }
    }
    function start() {
      attach();
      overlay.classList.add("is-hidden");
      video.controls = true;
      var result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(function () {});
      }
    }
    button.addEventListener("click", start);
    overlay.addEventListener("click", start);
    video.addEventListener("click", function () {
      if (!attached) {
        start();
      }
    });
    video.addEventListener("play", function () {
      overlay.classList.add("is-hidden");
    });
    window.addEventListener("beforeunload", function () {
      if (hls && typeof hls.destroy === "function") {
        hls.destroy();
      }
    });
  };
})();
