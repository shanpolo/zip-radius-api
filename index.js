import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ZIP data
const zipData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "us_zips.json"), "utf8")
);

const app = express();
app.use(express.json());

// Fixed service center: Montgomery Rd, Cincinnati
const CENTER = {
  lat: 39.1753,
  lng: -84.35
};

// Haversine distance in miles
function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = d => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Radius check endpoint
app.post("/check-radius", (req, res) => {
  const { zip, city, state } = req.body;

  let location = null;

  // 1) Try ZIP first (FORCE STRING COMPARISON)
  if (zip) {
    location = zipData.find(
      z => String(z.zip) === String(zip)
    );
  }

  // 2) Fallback to city + state
  if (!location && city && state) {
    location = zipData.find(
      z =>
        z.city.toLowerCase() === city.toLowerCase() &&
        z.state.toLowerCase() === state.toLowerCase()
    );
  }

  if (!location) {
    return res.json({ eligible: false });
  }

  const distance = haversineMiles(
    location.lat,
    location.lng,
    CENTER.lat,
    CENTER.lng
  );

  res.json({
    eligible: distance <= 15,
    distance: Math.round(distance * 10) / 10
  });
});

// Start server (Railway-compatible)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("API running on port", PORT);
});
