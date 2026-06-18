(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    ready(function () {
        var toggle = document.querySelector(".menu-toggle");
        var mobileNav = document.querySelector(".mobile-nav");
        if (toggle && mobileNav) {
            toggle.addEventListener("click", function () {
                var open = mobileNav.classList.toggle("open");
                toggle.setAttribute("aria-expanded", open ? "true" : "false");
            });
        }

        var hero = document.querySelector("[data-hero]");
        if (hero) {
            var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
            var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
            var index = 0;
            var show = function (next) {
                if (!slides.length) {
                    return;
                }
                index = (next + slides.length) % slides.length;
                slides.forEach(function (slide, i) {
                    slide.classList.toggle("active", i === index);
                });
                dots.forEach(function (dot, i) {
                    dot.classList.toggle("active", i === index);
                });
            };
            dots.forEach(function (dot) {
                dot.addEventListener("click", function () {
                    show(Number(dot.getAttribute("data-slide")) || 0);
                });
            });
            window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        var filterInput = document.querySelector("[data-filter-input]");
        var filterSelects = Array.prototype.slice.call(document.querySelectorAll("[data-filter-select]"));
        var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));
        var empty = document.querySelector(".filter-empty");
        if (filterInput && cards.length) {
            var params = new URLSearchParams(window.location.search);
            var q = params.get("q");
            if (q) {
                filterInput.value = q;
            }
            var applyFilter = function () {
                var keyword = filterInput.value.trim().toLowerCase();
                var shown = 0;
                cards.forEach(function (card) {
                    var title = (card.getAttribute("data-title") || "").toLowerCase();
                    var matched = !keyword || title.indexOf(keyword) !== -1;
                    filterSelects.forEach(function (select) {
                        var key = select.getAttribute("data-filter-select");
                        var value = select.value;
                        if (value && card.getAttribute("data-" + key) !== value) {
                            matched = false;
                        }
                    });
                    card.style.display = matched ? "" : "none";
                    if (matched) {
                        shown += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle("visible", shown === 0);
                }
            };
            filterInput.addEventListener("input", applyFilter);
            filterSelects.forEach(function (select) {
                select.addEventListener("change", applyFilter);
            });
            applyFilter();
        }
    });
})();

function initMoviePlayer(movieStream) {
    var video = document.querySelector(".movie-video");
    var cover = document.querySelector(".player-cover");
    if (!video || !movieStream) {
        return;
    }
    var hls = null;
    var loaded = false;
    var loadStream = function () {
        if (loaded) {
            return;
        }
        loaded = true;
        if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(movieStream);
            hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = movieStream;
        } else {
            video.src = movieStream;
        }
        video.controls = true;
    };
    var begin = function () {
        loadStream();
        if (cover) {
            cover.classList.add("is-hidden");
        }
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
            promise.catch(function () {
                if (cover) {
                    cover.classList.remove("is-hidden");
                }
            });
        }
    };
    if (cover) {
        cover.addEventListener("click", function (event) {
            event.preventDefault();
            begin();
        });
    }
    video.addEventListener("click", function () {
        if (video.paused) {
            begin();
        }
    });
    video.addEventListener("play", function () {
        if (cover) {
            cover.classList.add("is-hidden");
        }
    });
    window.addEventListener("beforeunload", function () {
        if (hls) {
            hls.destroy();
        }
    });
}
