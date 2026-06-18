(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function initPlayer(card) {
    var video = card.querySelector("video");
    var button = card.querySelector(".player-overlay");
    var url = card.getAttribute("data-video-url");
    var attached = false;
    var hls = null;

    if (!video || !url) {
      return;
    }

    function attach() {
      if (attached) {
        return Promise.resolve();
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        return Promise.resolve();
      }
      if (window.Hls && window.Hls.isSupported()) {
        return new Promise(function (resolve) {
          hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            resolve();
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (!data || !data.fatal) {
              return;
            }
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              hls.destroy();
            }
          });
        });
      }
      video.src = url;
      return Promise.resolve();
    }

    function play() {
      attach().then(function () {
        var action = video.play();
        card.classList.add("is-playing");
        if (action && typeof action.catch === "function") {
          action.catch(function () {});
        }
      });
    }

    function toggle() {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    }

    if (button) {
      button.addEventListener("click", play);
    }
    video.addEventListener("click", toggle);
    video.addEventListener("play", function () {
      card.classList.add("is-playing");
    });
    video.addEventListener("pause", function () {
      if (!video.ended) {
        card.classList.remove("is-playing");
      }
    });
    video.addEventListener("ended", function () {
      card.classList.remove("is-playing");
    });
    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  ready(function () {
    document.querySelectorAll(".player-card").forEach(initPlayer);
  });
})();
