const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(express.static("FE"));

app.get("/songs", (req, res) => {
    const files = fs.readdirSync(path.join(__dirname, "FE/Songs"));
    const songs = files.map(file => ({
        name: file.replace(".mp3", ""),
        filePath: `/Songs/${file}`
    }));
    res.json(songs);
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
