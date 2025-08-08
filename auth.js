const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();
const app = express();

app.get("/login", (req, res) => {
  const scopes = "user-top-read";
  res.redirect(
    `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=http://127.0.0.1:8888/callback`
  );
});

app.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  const tokenUrl = "https://accounts.spotify.com/api/token";
  const authOptions = {
    method: "post",
    url: tokenUrl,
    data: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: "http://127.0.0.1:8888/callback",
    }),
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  const response = await axios(authOptions);
  console.log("REFRESH TOKEN:", response.data.refresh_token);
  res.send("Check terminal for refresh token");
});

app.listen(8888, () => console.log("Go to http://127.0.0.1:8888/login"));
