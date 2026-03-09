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
    //this.player = document.getElementById("player");
    this.playButton = document.getElementById("playBtn");
    this.backButton = document.getElementById("backBtn");
    this.forwardButton = document.getElementById("forwardBtn");
    this.progressBar = document.getElementById("progressBar");
    this.totalTime = document.getElementById("totalTime");
    this.currentTime = document.getElementById("currentTime");
    this.songName = document.getElementById("songName");
  }

  // -- -- -- Methods: -- -- --
  // -- -- Initialize button functions -- --
  bindEvents()
  {
    //-- Pause/Play --
    this.playButton.addEventListener("click", () => {
    
      if(this.audio.paused)
      {
        if(!this.audio.src)
        {
          this.loadSong();
        }
        this.play();
        this.playButton.innerHTML = '<i class = "fa-solid fa-pause"></i>';
      }
      else
      {
        this.pause();
        this.playButton.innerHTML = '<i class = "fa-solid fa-play"></i>';
      }
  })
    // -- Next Song -- 
    this.forwardButton.addEventListener("click", () => {
    this.next();
    this.playButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
  })
    // -- Previous Song -- 
  this.backButton.addEventListener("click", () => {
    this.back();
    this.playButton.innerHTML = '<i class="fa-solid fa-pause"></i>'; 
  })
  this.audio.addEventListener("loadedmetadata", () => {
    this.progressBar.max = this.audio.duration;
    this.songName.textContent = this.currentSongName();
    // Update max time
    this.totalTime.textContent = formatTime(this.audio.duration);
  });

  this.audio.addEventListener("timeupdate", () => {
    this.progressBar.value = this.audio.currentTime;
    // Updated time logic
    this.currentTime.textContent = formatTime(this.audio.currentTime);
  });

  this.progressBar.addEventListener("input", () => {
    this.audio.currentTime = this.progressBar.value;
  });

  this.audio.addEventListener("ended", () => {
    this.next();
    this.playButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
  })

  }
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
  // pause the song
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
  }
  // previous song
  back()
  {
    if(this.currentIndex == 0) this.currentIndex = this.songs.length - 1;
    else this.currentIndex = this.currentIndex - 1;
    this.loadSong();
    this.play();
  }
  // return the song name
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

const songs = [
  new Song("No Role Modelz", "Songs/NoRoleModelz.mp3"),
  new Song("She Knows", "Songs/SheKnows.mp3"),
  new Song("Wet Dreamz", "Songs/WetDreamz.mp3"),
  new Song("Wind", "Songs/Wind.mp3"),
  new Song("Luv Sic", "Songs/luv_sic.mp3")
];

const songPlayer = new SongPlayer(document.getElementById("player"),songs);
songPlayer.bindEvents();
