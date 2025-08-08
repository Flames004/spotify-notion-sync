const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

async function getAccessToken() {
  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
    }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response.data.access_token;
}

// Helper function to format duration from milliseconds
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, '0')}`;
}

async function getTopTracks() {
  const token = await getAccessToken();
  const res = await axios.get(
    "https://api.spotify.com/v1/me/top/tracks?limit=10",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  return res.data.items.map(track => ({
    name: track.name,
    artist: track.artists.map(a => a.name).join(", "),
    album: track.album.name,
    spotifyUrl: track.external_urls.spotify,
    releaseDate: track.album.release_date,
    duration: formatDuration(track.duration_ms),
    albumImageUrl: track.album.images[0]?.url || null, // Optional: album cover
  }));
}

async function addToNotion(tracks) {
  for (const track of tracks) {
    try {
      // Create the properties object with new fields
      const properties = {
        Title: { title: [{ text: { content: track.name } }] },
        Artist: { rich_text: [{ text: { content: track.artist } }] },
        Album: { rich_text: [{ text: { content: track.album } }] },
        "Spotify URL": { url: track.spotifyUrl },
      };

      await axios.post(
        "https://api.notion.com/v1/pages",
        {
          parent: { database_id: process.env.NOTION_DATABASE_ID },
          properties: properties,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`✅ Added: ${track.name} by ${track.artist}`);
    } catch (error) {
      console.error(`❌ Error adding ${track.name}:`, error.response?.data || error.message);
    }
  }
}

(async () => {
  try {
    const tracks = await getTopTracks();
    console.log(`📊 Found ${tracks.length} top tracks`);
    await addToNotion(tracks);
    console.log("🎵 Sync completed!");
  } catch (error) {
    console.error("❌ Sync failed:", error.message);
  }
})();

// CommonJS export
module.exports = { getTopTracks };
