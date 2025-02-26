const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// File to store data
const DATA_FILE = "data.json";

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeJsonSync(DATA_FILE, { likes: 0, stars: 0, ratings: [] });
}

// Read current stats
app.get("/stats", async (req, res) => {
    const data = await fs.readJson(DATA_FILE);
    res.json(data);
});

// Update likes
app.post("/like", async (req, res) => {
    const data = await fs.readJson(DATA_FILE);
    data.likes++;
    await fs.writeJson(DATA_FILE, data);
    res.json({ success: true, likes: data.likes });
});

// Update star ratings
app.post("/star", async (req, res) => {
    const { value } = req.body;
    const data = await fs.readJson(DATA_FILE);
    
    if (value >= 1 && value <= 5) {
        data.ratings.push(value);
        data.stars = data.ratings.length;
        data.averageRating = data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length;
        await fs.writeJson(DATA_FILE, data);
    }
    
    res.json({ success: true, stars: data.stars, averageRating: data.averageRating });
});

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
