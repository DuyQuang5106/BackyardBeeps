class Song
{
  // Attributes:
  // Song name
  // Song filepath
  constructor(name, filePath)
  {
    this.name = name;
    this.filePath = filePath;
  }
  // Methods:
}

class SongPlayer
{
  // Attributes:
  // An array of songs
  // Number of songs
  constructor(audioElement, songList)
  {
    this.audio  = audioElement;
    this.songs = songList;
    this.currentIndex = 0;
  }

  // Methods:
  // load the song
  loadSong()
  {
    this.audio.src = this.songs[this.currentIndex].filePath;
  }
  // play current song
  play()
  {
    this.audio.play();
  }
  pause()
  {
    this.audio.pause();
  }
  // next song
  next()
  {
    this.currentIndex = (this.currentIndex + 1) % this.songs.length;
    this.loadSong();
    this.play();
  }// previous song
  back()
  {
    if(this.currentIndex == 0) this.currentIndex = this.songs.length - 1;
    else this.currentIndex = this.currentIndex - 1;
    this.loadSong();
    this.play();
  }
  currentSongName()
  {
    return this.songs[this.currentIndex].name;
  }
}

function formatTime(seconds)
{
  const minute = Math.floor(seconds / 60);
  const second = Math.floor(seconds % 60);

  if(second < 10)
  {
    return minute + ":0" + second;
  }
  return minute + ":" + second;
}
const player = document.getElementById("player");
const playButton = document.getElementById("playBtn");
const backButton = document.getElementById("backBtn");
const forwardButton = document.getElementById("forwardBtn");
const progressBar = document.getElementById("progressBar");
const totalTime = document.getElementById("totalTime");
const currentTime = document.getElementById("currentTime");
const songName = document.getElementById("songName");

const songs = [
  new Song("No Role Modelz", "Songs/NoRoleModelz.mp3"),
  new Song("She Knows", "Songs/SheKnows.mp3"),
  new Song("Wet Dreamz", "Songs/WetDreamz.mp3"),
  new Song("Wind", "Songs/Wind.mp3")
];

const songPlayer = new SongPlayer(player, songs);

playButton.addEventListener("click", function() {
  if (player.paused)
  {
    if(!player.src)
    {
      songPlayer.loadSong();
    }
    songPlayer.play();
    playButton.innerHTML = '<i class = "fa-solid fa-pause"></i>';
  }
  else
  {
    songPlayer.pause();
    playButton.innerHTML = '<i class = "fa-solid fa-play"></i>';
  }
})

forwardButton.addEventListener("click", function() {
  songPlayer.next();
  playButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
})

backButton.addEventListener("click", function() {
  songPlayer.back();
  playButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
})
player.addEventListener("loadedmetadata", function() {
  progressBar.max = player.duration;
  songName.textContent = songPlayer.currentSongName();
  // Update max time
  totalTime.textContent = formatTime(player.duration);
});

player.addEventListener("timeupdate", function() {
  progressBar.value = player.currentTime;
  // Updated time logic
  currentTime.textContent = formatTime(player.currentTime);
});

progressBar.addEventListener("input", function() {
  player.currentTime = progressBar.value;
});

player.addEventListener("ended", function() {
  songPlayer.next();
  playButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
})

