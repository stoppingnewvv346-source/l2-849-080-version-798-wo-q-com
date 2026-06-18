(function () {
    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function setupMenu() {
        var button = document.querySelector("[data-menu-button]");
        var nav = document.querySelector("[data-mobile-nav]");
        if (!button || !nav) {
            return;
        }
        button.addEventListener("click", function () {
            nav.classList.toggle("is-open");
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

        function show(nextIndex) {
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

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
            });
        }
        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener("click", function () {
                show(dotIndex);
            });
        });
        show(0);
        window.setInterval(function () {
            show(index + 1);
        }, 5000);
    }

    function setupSearch() {
        var input = document.querySelector("[data-search-input]");
        var allCards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
        var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
        var sort = document.querySelector("[data-sort-select]");
        var grid = document.querySelector("[data-movie-grid]");
        var sortableCards = grid ? Array.prototype.slice.call(grid.querySelectorAll("[data-movie-card]")) : allCards;
        var empty = document.querySelector("[data-empty-state]");
        var activeFilter = "all";

        if (!allCards.length) {
            return;
        }

        var params = new URLSearchParams(window.location.search);
        var initialSearch = params.get("search");
        if (input && initialSearch) {
            input.value = initialSearch;
        }

        function matchesFilter(card) {
            if (activeFilter === "all") {
                return true;
            }
            var parts = activeFilter.split(":");
            var key = parts[0];
            var expected = normalize(parts.slice(1).join(":"));
            return normalize(card.dataset[key]).indexOf(expected) !== -1;
        }

        function matchesSearch(card) {
            var query = input ? normalize(input.value) : "";
            if (!query) {
                return true;
            }
            var haystack = [
                card.dataset.title,
                card.dataset.region,
                card.dataset.type,
                card.dataset.year,
                card.dataset.genre,
                card.dataset.tags
            ].map(normalize).join(" ");
            return haystack.indexOf(query) !== -1;
        }

        function apply() {
            var visible = 0;
            allCards.forEach(function (card) {
                var ok = matchesFilter(card) && matchesSearch(card);
                card.hidden = !ok;
                if (ok) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle("is-visible", visible === 0);
            }
        }

        if (input) {
            input.addEventListener("input", apply);
        }

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                activeFilter = button.dataset.filter || "all";
                buttons.forEach(function (item) {
                    item.classList.toggle("is-active", item === button);
                });
                apply();
            });
        });

        if (sort && grid) {
            sort.addEventListener("change", function () {
                var sorted = sortableCards.slice();
                var value = sort.value;
                if (value === "score-desc") {
                    sorted.sort(function (a, b) {
                        return Number(b.dataset.score || 0) - Number(a.dataset.score || 0);
                    });
                }
                if (value === "year-desc") {
                    sorted.sort(function (a, b) {
                        return Number(b.dataset.year || 0) - Number(a.dataset.year || 0);
                    });
                }
                if (value === "title-asc") {
                    sorted.sort(function (a, b) {
                        return String(a.dataset.title || "").localeCompare(String(b.dataset.title || ""), "zh-CN");
                    });
                }
                sorted.forEach(function (card) {
                    grid.appendChild(card);
                });
                apply();
            });
        }

        apply();
    }

    function setupPlayer() {
        var player = document.querySelector("[data-player]");
        if (!player) {
            return;
        }
        var video = player.querySelector("video");
        var overlay = player.querySelector("[data-player-overlay]");
        var button = player.querySelector("[data-player-button]");
        if (!video) {
            return;
        }
        var source = video.getAttribute("data-src");
        var hlsInstance = null;

        function ensureSource() {
            if (!source || video.dataset.ready === "true") {
                return;
            }
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: false });
                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);
            } else {
                video.src = source;
            }
            video.dataset.ready = "true";
        }

        function playVideo() {
            ensureSource();
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () {});
            }
        }

        if (overlay) {
            overlay.addEventListener("click", playVideo);
        }
        if (button) {
            button.addEventListener("click", function (event) {
                event.stopPropagation();
                playVideo();
            });
        }
        video.addEventListener("click", function () {
            ensureSource();
            if (video.paused) {
                playVideo();
            } else {
                video.pause();
            }
        });
        video.addEventListener("play", function () {
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        setupMenu();
        setupHero();
        setupSearch();
        setupPlayer();
    });
})();
