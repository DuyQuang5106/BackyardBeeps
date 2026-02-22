const player = document.getElementById("player");
const button = document.getElementById("playBtn");

button.addEventListener("click", function() {
  player.play();
});