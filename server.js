const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.static("FE"));
app.get("/songs", (req, res) => {
    const files = fs.readdirSync("FE/songs");  
    const songs = files.map(file => ({
        name: file. replace(".mp3", ""),
        filepath: '/songs/${file}'
    }));

    res.json(songs);
})