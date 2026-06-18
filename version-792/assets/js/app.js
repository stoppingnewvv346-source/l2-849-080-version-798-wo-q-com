(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileMenu = document.querySelector('[data-mobile-menu]');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('is-open');
    });
  }

  var slider = document.querySelector('[data-hero-slider]');

  if (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    var previous = slider.querySelector('[data-hero-prev]');
    var next = slider.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function showSlide(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function startSlider() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, 5200);
    }

    if (previous) {
      previous.addEventListener('click', function () {
        showSlide(index - 1);
        startSlider();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(index + 1);
        startSlider();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        startSlider();
      });
    });

    startSlider();
  }

  var searchInput = document.querySelector('[data-search-input]');
  var grid = document.querySelector('[data-search-grid]');
  var emptyState = document.querySelector('[data-empty-state]');
  var clearButton = document.querySelector('[data-clear-search]');
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var activeFilter = '';

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function applyQueryFromUrl() {
    if (!searchInput) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q');

    if (query) {
      searchInput.value = query;
    }
  }

  function filterCards() {
    if (!grid) {
      return;
    }

    var query = normalize(searchInput ? searchInput.value : '');
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));
    var visibleCount = 0;

    cards.forEach(function (card) {
      var text = normalize([
        card.getAttribute('data-title'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-tags'),
        card.getAttribute('data-year'),
        card.getAttribute('data-region')
      ].join(' '));
      var genre = card.getAttribute('data-genre') || '';
      var passQuery = !query || text.indexOf(query) !== -1;
      var passFilter = !activeFilter || genre.indexOf(activeFilter) !== -1;
      var visible = passQuery && passFilter;

      card.hidden = !visible;

      if (visible) {
        visibleCount += 1;
      }
    });

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }
  }

  if (grid) {
    applyQueryFromUrl();
    filterCards();
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterCards);
  }

  if (clearButton) {
    clearButton.addEventListener('click', function () {
      if (searchInput) {
        searchInput.value = '';
      }

      activeFilter = '';
      filterButtons.forEach(function (button) {
        button.classList.toggle('is-active', !button.getAttribute('data-filter'));
      });
      filterCards();
    });
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.getAttribute('data-filter') || '';
      filterButtons.forEach(function (item) {
        item.classList.toggle('is-active', item === button);
      });
      filterCards();
    });
  });

  function loadHls(callback) {
    if (window.Hls) {
      callback();
      return;
    }

    var existing = document.querySelector('script[data-hls-loader]');

    if (existing) {
      existing.addEventListener('load', callback, { once: true });
      return;
    }

    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
    script.async = true;
    script.setAttribute('data-hls-loader', 'true');
    script.addEventListener('load', callback, { once: true });
    document.head.appendChild(script);
  }

  function setupPlayer(box) {
    var video = box.querySelector('video');
    var button = box.querySelector('.player-start');
    var source = box.getAttribute('data-video');
    var ready = false;
    var hlsInstance = null;
    var callbacks = [];

    if (!video || !source) {
      return;
    }

    function finishReady() {
      ready = true;
      while (callbacks.length) {
        var fn = callbacks.shift();
        fn();
      }
    }

    function prepare(callback) {
      if (ready) {
        callback();
        return;
      }

      callbacks.push(callback);

      if (callbacks.length > 1) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        finishReady();
        return;
      }

      loadHls(function () {
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MEDIA_ATTACHED, finishReady);
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              hlsInstance.destroy();
              video.src = source;
              finishReady();
            }
          });
        } else {
          video.src = source;
          finishReady();
        }
      });
    }

    function start() {
      prepare(function () {
        var playPromise = video.play();
        box.classList.add('is-playing');

        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            box.classList.remove('is-playing');
          });
        }
      });
    }

    if (button) {
      button.addEventListener('click', start);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });

    video.addEventListener('play', function () {
      box.classList.add('is-playing');
    });

    video.addEventListener('pause', function () {
      if (!video.ended) {
        box.classList.remove('is-playing');
      }
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(setupPlayer);
})();
