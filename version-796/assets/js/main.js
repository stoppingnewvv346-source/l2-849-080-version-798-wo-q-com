(function () {
  function selectAll(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function initMobileNav() {
    var toggle = document.querySelector('[data-mobile-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function initHero() {
    var root = document.querySelector('[data-hero-carousel]');
    if (!root) {
      return;
    }
    var slides = selectAll('[data-hero-slide]', root);
    var dots = selectAll('[data-hero-dot]', root);
    var prev = root.querySelector('[data-hero-prev]');
    var next = root.querySelector('[data-hero-next]');
    var active = 0;
    var timer = null;

    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, idx) {
        slide.classList.toggle('is-active', idx === active);
      });
      dots.forEach(function (dot, idx) {
        dot.classList.toggle('is-active', idx === active);
      });
    }

    function restart() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        show(active + 1);
      }, 5000);
    }

    dots.forEach(function (dot, idx) {
      dot.addEventListener('click', function () {
        show(idx);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(active - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(active + 1);
        restart();
      });
    }

    restart();
  }

  function textOf(card) {
    return [
      card.getAttribute('data-title'),
      card.getAttribute('data-category'),
      card.getAttribute('data-tags'),
      card.getAttribute('data-year'),
      card.textContent
    ].join(' ').toLowerCase();
  }

  function initFilters() {
    selectAll('[data-filter-scope]').forEach(function (scope) {
      var input = scope.querySelector('[data-filter-input]');
      var buttons = selectAll('[data-filter-value]', scope);
      var cards = selectAll('[data-filter-item]', scope);
      var activeValue = '全部';

      function apply() {
        var query = input ? input.value.trim().toLowerCase() : '';
        cards.forEach(function (card) {
          var text = textOf(card);
          var category = (card.getAttribute('data-category') || '').toLowerCase();
          var tags = (card.getAttribute('data-tags') || '').toLowerCase();
          var year = (card.getAttribute('data-year') || '').toLowerCase();
          var matchQuery = !query || text.indexOf(query) !== -1;
          var value = activeValue.toLowerCase();
          var matchButton = activeValue === '全部' || category.indexOf(value) !== -1 || tags.indexOf(value) !== -1 || year.indexOf(value) !== -1;
          card.hidden = !(matchQuery && matchButton);
        });
      }

      if (input) {
        input.addEventListener('input', apply);
      }

      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          activeValue = button.getAttribute('data-filter-value') || '全部';
          buttons.forEach(function (item) {
            item.classList.toggle('is-active', item === button);
          });
          apply();
        });
      });
    });
  }

  function createCard(movie) {
    var article = document.createElement('article');
    article.className = 'movie-card small';
    article.setAttribute('data-filter-item', '');

    var link = document.createElement('a');
    link.className = 'movie-link';
    link.href = movie.url;

    var poster = document.createElement('div');
    poster.className = 'movie-poster';

    var img = document.createElement('img');
    img.src = movie.cover;
    img.alt = movie.title;
    img.loading = 'lazy';
    poster.appendChild(img);

    var duration = document.createElement('span');
    duration.className = 'movie-duration';
    duration.textContent = movie.duration;
    poster.appendChild(duration);

    var play = document.createElement('span');
    play.className = 'play-hover';
    play.textContent = '▶';
    poster.appendChild(play);

    var body = document.createElement('div');
    body.className = 'movie-body';

    var title = document.createElement('h3');
    title.textContent = movie.title;
    body.appendChild(title);

    var desc = document.createElement('p');
    desc.textContent = movie.oneLine;
    body.appendChild(desc);

    var meta = document.createElement('div');
    meta.className = 'movie-meta';

    var score = document.createElement('span');
    score.textContent = '★ ' + movie.rating;
    meta.appendChild(score);

    var category = document.createElement('span');
    category.textContent = movie.category;
    meta.appendChild(category);

    var year = document.createElement('span');
    year.textContent = movie.year;
    meta.appendChild(year);

    body.appendChild(meta);
    link.appendChild(poster);
    link.appendChild(body);
    article.appendChild(link);
    return article;
  }

  function initSearchPage() {
    var input = document.querySelector('[data-search-input]');
    var results = document.querySelector('[data-search-results]');
    var status = document.querySelector('[data-search-status]');
    if (!input || !results || !window.SEARCH_DATA) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    if (initialQuery) {
      input.value = initialQuery;
    }

    function render(query) {
      var q = query.trim().toLowerCase();
      results.innerHTML = '';
      if (!q) {
        status.textContent = '输入关键词后浏览相关内容';
        return;
      }
      var matched = window.SEARCH_DATA.filter(function (movie) {
        return movie.searchText.indexOf(q) !== -1;
      }).slice(0, 96);
      if (!matched.length) {
        status.textContent = '未找到相关内容';
        return;
      }
      status.textContent = '已匹配相关内容';
      matched.forEach(function (movie) {
        results.appendChild(createCard(movie));
      });
    }

    input.addEventListener('input', function () {
      render(input.value);
    });

    selectAll('[data-search-chip]').forEach(function (button) {
      button.addEventListener('click', function () {
        input.value = button.getAttribute('data-search-chip') || '';
        render(input.value);
      });
    });

    render(input.value);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initHero();
    initFilters();
    initSearchPage();
  });

  window.setupMoviePlayer = function (source) {
    var video = document.querySelector('[data-player]');
    var startButton = document.querySelector('[data-player-start]');
    if (!video || !source) {
      return;
    }
    var hlsInstance = null;
    var started = false;

    function start() {
      if (!started) {
        started = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.play().catch(function () {});
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls();
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
        } else {
          video.src = source;
          video.play().catch(function () {});
        }
      } else {
        video.play().catch(function () {});
      }
      if (startButton) {
        startButton.classList.add('is-hidden');
      }
    }

    if (startButton) {
      startButton.addEventListener('click', start);
    }

    video.addEventListener('click', function () {
      if (!started) {
        start();
      }
    });

    window.addEventListener('pagehide', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };
})();
