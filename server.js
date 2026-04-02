const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(express.static("FE"));

app.get("/catalog", (req, res) => {
    try {
        const catalogPath = path.join(__dirname, "data", "catalog.json");
        const catalogData = fs.readFileSync(catalogPath, "utf-8");
        res.json(JSON.parse(catalogData));
    } catch(err) {
        res.status(500).json({ error: "Catalog not found" });
    }
});

// Provide a flattened /songs endpoint for backward compatibility with the current frontend
app.get("/songs", (req, res) => {
    try {
        const catalogPath = path.join(__dirname, "data", "catalog.json");
        const catalogData = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
        const songs = [];
        catalogData.albums.forEach(album => {
            album.tracks.forEach(track => {
                songs.push({
                    name: track.title,
                    filePath: track.filePath
                });
            });
        });
        res.json(songs);
    } catch(err) {
        res.status(500).json({ error: "Songs data not found" });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
