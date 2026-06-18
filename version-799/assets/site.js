(function () {
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.menu-toggle');

    if (header && toggle) {
        toggle.addEventListener('click', function () {
            header.classList.toggle('is-open');
        });
    }

    var hero = document.querySelector('[data-hero]');

    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var index = 0;
        var timer = null;

        function showHero(nextIndex) {
            if (!slides.length) {
                return;
            }

            index = (nextIndex + slides.length) % slides.length;

            slides.forEach(function (slide, current) {
                slide.classList.toggle('active', current === index);
            });

            dots.forEach(function (dot, current) {
                dot.classList.toggle('active', current === index);
            });
        }

        function playHero() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                showHero(index + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                showHero(Number(dot.getAttribute('data-hero-dot')) || 0);
                playHero();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                showHero(index - 1);
                playHero();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                showHero(index + 1);
                playHero();
            });
        }

        showHero(0);
        playHero();
    }

    var filterForm = document.querySelector('[data-filter-form]');
    var filterInput = document.querySelector('[data-filter-input]');
    var filterList = document.querySelector('[data-filter-list]');

    if (filterForm && filterInput && filterList) {
        var params = new URLSearchParams(window.location.search);
        var query = params.get('q') || '';

        if (query) {
            filterInput.value = query;
        }

        function filterItems() {
            var value = filterInput.value.trim().toLowerCase();
            var items = filterList.querySelectorAll('[data-search-item]');

            items.forEach(function (item) {
                var text = (item.getAttribute('data-search-text') || item.textContent || '').toLowerCase();
                item.classList.toggle('is-hidden', value !== '' && text.indexOf(value) === -1);
            });
        }

        filterForm.addEventListener('submit', function (event) {
            event.preventDefault();
            filterItems();
        });

        filterInput.addEventListener('input', filterItems);
        filterItems();
    }

    function loadHlsLibrary() {
        return new Promise(function (resolve) {
            if (window.Hls) {
                resolve(window.Hls);
                return;
            }

            var existing = document.querySelector('script[data-hls-lib]');

            if (existing) {
                existing.addEventListener('load', function () {
                    resolve(window.Hls || null);
                });
                existing.addEventListener('error', function () {
                    resolve(null);
                });
                return;
            }

            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
            script.async = true;
            script.setAttribute('data-hls-lib', '1');
            script.onload = function () {
                resolve(window.Hls || null);
            };
            script.onerror = function () {
                resolve(null);
            };
            document.head.appendChild(script);
        });
    }

    var playerShell = document.querySelector('.player-shell[data-video-url]');

    if (playerShell) {
        var video = playerShell.querySelector('video');
        var startButton = playerShell.querySelector('.player-start');
        var videoUrl = playerShell.getAttribute('data-video-url');
        var prepared = false;
        var preparing = null;

        function prepareVideo() {
            if (!video || !videoUrl) {
                return Promise.resolve();
            }

            if (prepared) {
                return Promise.resolve();
            }

            if (preparing) {
                return preparing;
            }

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = videoUrl;
                prepared = true;
                return Promise.resolve();
            }

            preparing = loadHlsLibrary().then(function (Hls) {
                if (Hls && Hls.isSupported()) {
                    var hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(videoUrl);
                    hls.attachMedia(video);
                    prepared = true;
                    return;
                }

                video.src = videoUrl;
                prepared = true;
            });

            return preparing;
        }

        function startVideo(event) {
            if (event) {
                event.preventDefault();
            }

            if (startButton) {
                startButton.classList.add('is-hidden');
            }

            prepareVideo().then(function () {
                var action = video.play();

                if (action && typeof action.catch === 'function') {
                    action.catch(function () {});
                }
            });
        }

        if (startButton) {
            startButton.addEventListener('click', startVideo);
        }

        playerShell.addEventListener('click', function (event) {
            if (event.target === video) {
                return;
            }

            startVideo(event);
        });

        if (video) {
            video.addEventListener('play', function () {
                if (startButton) {
                    startButton.classList.add('is-hidden');
                }
            });
        }
    }
})();
