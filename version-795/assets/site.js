(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  ready(function () {
    var menuButton = document.querySelector('[data-menu-button]');
    var mobilePanel = document.querySelector('[data-mobile-panel]');
    if (menuButton && mobilePanel) {
      menuButton.addEventListener('click', function () {
        mobilePanel.classList.toggle('is-open');
      });
    }

    document.querySelectorAll('[data-site-search]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = form.querySelector('input[name="q"]');
        var query = input ? input.value.trim() : '';
        var target = './search.html';
        if (query) {
          target += '?q=' + encodeURIComponent(query);
        }
        window.location.href = target;
      });
    });

    document.querySelectorAll('[data-hero]').forEach(function (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
      var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
      var prev = hero.querySelector('[data-hero-prev]');
      var next = hero.querySelector('[data-hero-next]');
      var current = 0;
      var timer = null;

      function show(index) {
        if (!slides.length) {
          return;
        }
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle('is-active', slideIndex === current);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle('is-active', dotIndex === current);
        });
      }

      function start() {
        window.clearInterval(timer);
        timer = window.setInterval(function () {
          show(current + 1);
        }, 5200);
      }

      dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
          show(index);
          start();
        });
      });

      if (prev) {
        prev.addEventListener('click', function () {
          show(current - 1);
          start();
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          show(current + 1);
          start();
        });
      }

      show(0);
      start();
    });

    document.querySelectorAll('[data-catalog-toolbar]').forEach(function (toolbar) {
      var section = toolbar.parentElement;
      var catalog = section ? section.querySelector('[data-catalog]') : null;
      if (!catalog) {
        return;
      }
      var searchInput = toolbar.querySelector('[data-catalog-search]');
      var sortSelect = toolbar.querySelector('[data-catalog-sort]');
      var categoryFilter = toolbar.querySelector('[data-category-filter]');
      var categoryJump = toolbar.querySelector('[data-catalog-jump]');
      var empty = section.querySelector('[data-catalog-empty]');
      var cards = Array.prototype.slice.call(catalog.querySelectorAll('[data-card]'));
      var original = cards.slice();

      if (categoryJump) {
        categoryJump.addEventListener('change', function () {
          if (categoryJump.value) {
            window.location.href = './category-' + categoryJump.value + '.html';
          }
        });
      }

      function cardValue(card, key) {
        if (key === 'rating') {
          return parseFloat(card.dataset.rating || '0');
        }
        if (key === 'views') {
          return parseInt(card.dataset.views || '0', 10);
        }
        if (key === 'year') {
          return parseInt(card.dataset.year || '0', 10);
        }
        if (key === 'title') {
          return card.dataset.title || '';
        }
        return 0;
      }

      function apply() {
        var query = normalize(searchInput ? searchInput.value : '');
        var cat = categoryFilter ? categoryFilter.value : 'all';
        var sort = sortSelect ? sortSelect.value : 'default';
        var visible = [];

        cards.forEach(function (card) {
          var matchesQuery = !query || normalize(card.dataset.search).indexOf(query) !== -1;
          var matchesCat = cat === 'all' || card.dataset.category === cat;
          var isVisible = matchesQuery && matchesCat;
          card.hidden = !isVisible;
          if (isVisible) {
            visible.push(card);
          }
        });

        var ordered = sort === 'default'
          ? original.filter(function (card) { return !card.hidden; })
          : visible.slice().sort(function (a, b) {
              if (sort === 'title') {
                return cardValue(a, sort).localeCompare(cardValue(b, sort), 'zh-Hans-CN');
              }
              return cardValue(b, sort) - cardValue(a, sort);
            });

        ordered.forEach(function (card) {
          catalog.appendChild(card);
        });

        if (empty) {
          empty.hidden = visible.length !== 0;
        }
      }

      if (searchInput) {
        searchInput.addEventListener('input', apply);
      }
      if (sortSelect) {
        sortSelect.addEventListener('change', apply);
      }
      if (categoryFilter) {
        categoryFilter.addEventListener('change', apply);
      }

      var urlQuery = new URLSearchParams(window.location.search).get('q');
      var searchPageInput = toolbar.querySelector('[data-search-page-input]');
      if (urlQuery && searchPageInput) {
        searchPageInput.value = urlQuery;
      }
      apply();
    });

    document.querySelectorAll('[data-player]').forEach(function (player) {
      var video = player.querySelector('video');
      var button = player.querySelector('[data-play]');
      if (!video) {
        return;
      }
      var source = video.dataset.src;
      var initialized = false;
      var hlsInstance = null;

      function initialize() {
        if (initialized || !source) {
          return;
        }
        initialized = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false,
            maxBufferLength: 30
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
        } else {
          video.src = source;
        }
      }

      function play() {
        initialize();
        video.controls = true;
        player.classList.add('is-playing');
        var attempt = video.play();
        if (attempt && typeof attempt.catch === 'function') {
          attempt.catch(function () {
            player.classList.remove('is-playing');
          });
        }
      }

      if (button) {
        button.addEventListener('click', play);
      }
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener('play', function () {
        player.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        if (!video.controls) {
          player.classList.remove('is-playing');
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  });
})();
