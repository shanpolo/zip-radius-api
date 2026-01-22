import express from "express";
import zipData from "./us_zips.json" assert { type: "json" };

const app = express();
app.use(express.json());

// Fixed service center: Montgomery Rd, Cincinnati
const CENTER = {
  lat: 39.1753,
  lng: -84.3500
};

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

app.post("/check-radius", (req, res) => {
  const { zip, city, state } = req.body;

  let location = null;

  // Try ZIP first
  if (zip) {
    location = zipData.find(z => z.zip === zip);
  }

  // Fallback to city + state
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API running on port", PORT));