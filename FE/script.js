class PlayerState {
  constructor(audioElement) {
    this.audio = audioElement;
    this.queue = [];
    this.currentIndex = 0;
    this.onStateChange = null;
    
    // Playback modes
    this.isShuffle = false;
    this.repeatMode = 0; // 0 = off, 1 = all, 2 = one
    this.shuffleHistory = [];

    // Setup Audio events mapping to state update
    this.audio.addEventListener("timeupdate", () => this.notify());
    this.audio.addEventListener("loadedmetadata", () => this.notify());
    this.audio.addEventListener("ended", () => {
      if (this.repeatMode === 2) {
        this.play();
      } else {
        this.next();
      }
    });
    this.audio.addEventListener("play", () => { 
        this.updateMediaSessionState();
        this.notify(); 
    });
    this.audio.addEventListener("pause", () => { 
        this.updateMediaSessionState();
        this.notify(); 
    });

    this.setupMediaSession();
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.shuffleHistory = [];
    if (this.isShuffle && this.currentIndex >= 0 && this.queue.length > 0) {
      this.shuffleHistory.push(this.currentIndex);
    }
    this.notify();
  }

  toggleRepeat() {
    this.repeatMode = (this.repeatMode + 1) % 3;
    this.notify();
  }

  setQueue(songs) {
    this.queue = songs;
    this.shuffleHistory = [];
    if (songs.length > 0) {
        let firstIndex = 0;
        if (this.isShuffle) {
           firstIndex = Math.floor(Math.random() * this.queue.length);
        }
        this.load(firstIndex); // Load first song without auto-play
    } else {
        this.notify();
    }
  }

  setupMediaSession() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    }
  }

  updateMediaSessionState() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = this.audio.paused ? 'paused' : 'playing';
    }
  }

  updateMediaSessionMetadata() {
    if ('mediaSession' in navigator && this.currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.currentSong.title || this.currentSong.name || "Unknown Track",
        artist: this.currentSong.artist || "BackyardBeeps",
        artwork: [
          { src: '/images/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });
    }
  }

  get currentSong() {
    return this.queue[this.currentIndex] || null;
  }

  load(index) {
    if (index >= 0 && index < this.queue.length) {
      this.currentIndex = index;
      if (this.isShuffle && !this.shuffleHistory.includes(index)) {
         this.shuffleHistory.push(index);
      }
      this.audio.src = this.currentSong.filePath;
      this.updateMediaSessionMetadata();
      this.notify();
    }
  }

  play() {
    if (!this.audio.src && this.currentSong) {
       this.load(this.currentIndex);
    }
    this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  next() {
    if (this.queue.length === 0) return;
    
    if (this.isShuffle) {
      const remainingIndexes = this.queue.map((_, i) => i).filter(i => !this.shuffleHistory.includes(i));
      if (remainingIndexes.length === 0) {
         if (this.repeatMode === 1) { // Repeat All
             this.shuffleHistory = [this.currentIndex]; // keep current
             const allIndexes = this.queue.map((_, i) => i).filter(i => i !== this.currentIndex);
             if (allIndexes.length > 0) {
                const nextIdx = allIndexes[Math.floor(Math.random() * allIndexes.length)];
                this.load(nextIdx);
                this.play();
             } else {
                this.load(this.currentIndex);
                this.play();
             }
         }
         return; // If not repeat all, stop playback (reached end of shuffle queue)
      }
      const nextIdx = remainingIndexes[Math.floor(Math.random() * remainingIndexes.length)];
      this.load(nextIdx);
      this.play();
    } else {
      const nextIdx = (this.currentIndex + 1) % this.queue.length;
      if (nextIdx === 0 && this.repeatMode === 0) return; // Reached end of straight playlist, no repeat
      this.load(nextIdx);
      this.play();
    }
  }

  prev() {
    if (this.queue.length === 0) return;
    
    if (this.isShuffle) {
      if (this.shuffleHistory.length > 1) {
         this.shuffleHistory.pop(); // remove current
         const prevIdx = this.shuffleHistory[this.shuffleHistory.length - 1];
         this.load(prevIdx);
         this.play();
      } else {
         this.audio.currentTime = 0; // replay current if it's the first
      }
    } else {
      const prevIdx = this.currentIndex === 0 ? this.queue.length - 1 : this.currentIndex - 1;
      this.load(prevIdx);
      this.play();
    }
  }

  notify() {
    if (this.onStateChange) {
      this.onStateChange({
        song: this.currentSong,
        isPlaying: !this.audio.paused,
        currentTime: this.audio.currentTime,
        duration: this.audio.duration,
        queue: this.queue,
        currentIndex: this.currentIndex,
        isShuffle: this.isShuffle,
        repeatMode: this.repeatMode
      });
    }
  }
}

const UIElements = {
  shuffleBtn: document.getElementById("shuffleBtn"),
  repeatBtn: document.getElementById("repeatBtn"),
  playBtn: document.getElementById("playBtn"),
  backBtn: document.getElementById("backBtn"),
  forwardBtn: document.getElementById("forwardBtn"),
  progressBar: document.getElementById("progressBar"),
  currentTime: document.getElementById("currentTime"),
  totalTime: document.getElementById("totalTime"),
  songName: document.getElementById("songName"),
  playlist: document.getElementById("playlist")
};

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const minute = Math.floor(seconds / 60);
  const second = Math.floor(seconds % 60);
  return second < 10 ? minute + ":0" + second : minute + ":" + second;
}

const DOM = {
  albumGrid: document.getElementById("album-grid"),
  categoryFilters: document.getElementById("category-filters")
};

const SUGGESTIONS_DOM = {
  area: document.getElementById("suggestions-area"),
  grid: document.getElementById("suggested-grid")
};

let catalogData = null;

function trackListen(album) {
  let history = JSON.parse(localStorage.getItem("playHistory") || "[]");
  history.push({ id: album.id, tags: album.tags });
  if (history.length > 50) history.shift();
  localStorage.setItem("playHistory", JSON.stringify(history));
  updateSuggestions();
}

function updateSuggestions() {
  let history = JSON.parse(localStorage.getItem("playHistory") || "[]");
  if (history.length === 0 || !catalogData) return;

  const tagCounts = {};
  history.forEach(h => {
    h.tags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  let topTag = Object.keys(tagCounts).reduce((a, b) => tagCounts[a] > tagCounts[b] ? a : b, null);
  const lastPlayedId = history[history.length - 1].id;
  const recommendations = catalogData.albums.filter(a => a.id !== lastPlayedId && a.tags.includes(topTag));

  if (recommendations.length > 0) {
    SUGGESTIONS_DOM.area.style.display = "block";
    SUGGESTIONS_DOM.grid.innerHTML = "";
    recommendations.forEach(album => {
      const card = document.createElement("div");
      card.className = "album-card";
      card.innerHTML = `
        <img src="${album.coverArt}" class="album-cover" alt="Cover">
        <div class="album-title">${album.title}</div>
        <div class="album-artist">${album.artist || "Unknown"}</div>
      `;
      card.addEventListener("click", () => window.loadAlbumIntoQueue(album));
      SUGGESTIONS_DOM.grid.appendChild(card);
    });
  } else {
    SUGGESTIONS_DOM.area.style.display = "none";
  }
}

function renderFilters(albums) {
  const tags = new Set(["All"]);
  albums.forEach(album => album.tags.forEach(t => tags.add(t)));
  
  DOM.categoryFilters.innerHTML = "";
  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = tag === "All" ? "filter-btn active" : "filter-btn";
    btn.textContent = tag;
    btn.onclick = () => filterAlbums(tag, btn);
    DOM.categoryFilters.appendChild(btn);
  });
}

function filterAlbums(tag, btnElem) {
  // Update active button state
  Array.from(DOM.categoryFilters.children).forEach(b => b.classList.remove("active"));
  btnElem.classList.add("active");
  
  // Render filtered grid
  let filtered = tag === "All" ? catalogData.albums : catalogData.albums.filter(a => a.tags.includes(tag));
  renderAlbumGrid(filtered);
}

function renderAlbumGrid(albums) {
  DOM.albumGrid.innerHTML = "";
  albums.forEach(album => {
    const card = document.createElement("div");
    card.className = "album-card";
    card.innerHTML = `
      <img src="${album.coverArt}" class="album-cover" alt="Cover">
      <div class="album-title">${album.title}</div>
      <div class="album-artist">${album.artist || "Unknown"}</div>
    `;
    card.addEventListener("click", () => window.loadAlbumIntoQueue(album));
    DOM.albumGrid.appendChild(card);
  });
}

async function init() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(console.error);

  const playerState = new PlayerState(document.getElementById("player"));

  // Fetch New Structured Catalog
  const res = await fetch("/catalog");
  catalogData = await res.json();
  
  renderFilters(catalogData.albums);
  renderAlbumGrid(catalogData.albums);
  updateSuggestions();

  playerState.onStateChange = (state) => {
    UIElements.playBtn.innerHTML = state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    if (state.song) UIElements.songName.textContent = state.song.title || state.song.name;
    UIElements.currentTime.textContent = formatTime(state.currentTime);
    UIElements.totalTime.textContent = formatTime(state.duration);
    
    if (!isNaN(state.duration) && state.duration > 0) {
      UIElements.progressBar.max = state.duration;
      UIElements.progressBar.value = state.currentTime;
      document.documentElement.style.setProperty("--progress", (state.currentTime / state.duration) * 100 + "%");
    }

    if (state.isShuffle) UIElements.shuffleBtn.classList.add("highlight");
    else UIElements.shuffleBtn.classList.remove("highlight");
    
    if (state.repeatMode === 0) {
      UIElements.repeatBtn.classList.remove("highlight");
      UIElements.repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    } else if (state.repeatMode === 1) {
      UIElements.repeatBtn.classList.add("highlight");
      UIElements.repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    } else if (state.repeatMode === 2) {
      UIElements.repeatBtn.classList.add("highlight");
      UIElements.repeatBtn.innerHTML = '1';
    }

    renderQueueUI(state);
  };

  function renderQueueUI(state) {
    UIElements.playlist.innerHTML = "";
    state.queue.forEach((track, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${track.title || track.name}</span>`;
      if (i === state.currentIndex) li.classList.add("active");
      li.addEventListener("click", () => {
        playerState.load(i);
        playerState.play();
      });
      UIElements.playlist.appendChild(li);
    });
  }

  // Define global queue load method
  window.loadAlbumIntoQueue = (album) => {
    trackListen(album);
    playerState.setQueue([...album.tracks]);
    playerState.play(); // Auto-play the first track
  };

  // Bind Buttons
  UIElements.shuffleBtn.addEventListener("click", () => playerState.toggleShuffle());
  UIElements.repeatBtn.addEventListener("click", () => playerState.toggleRepeat());
  UIElements.playBtn.addEventListener("click", () => playerState.audio.paused ? playerState.play() : playerState.pause());
  UIElements.backBtn.addEventListener("click", () => playerState.prev());
  UIElements.forwardBtn.addEventListener("click", () => playerState.next());
  UIElements.progressBar.addEventListener("input", () => playerState.audio.currentTime = UIElements.progressBar.value);
}

init();
