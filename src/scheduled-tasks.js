const appRoot = require("app-root-path");
const { getAppState } = require("facebook-chat-api/utils");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const config = require(appRoot + "/database/config.js");
const SpotifyWebApi = require("spotify-web-api-node");
const { resolve } = require("path");

///////////////////////////Initialize LocalStorage
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require("node-localstorage").LocalStorage;
  localStorage = new LocalStorage("./scratch");
}

//////////////////////////////////////////////////////Initialize Local Storage Vars
async function initSpotifyPlaylist() {
  const spotifyApi = await getSpotifyToken();
  var playlist = await spotifyApi.getPlaylist(config.playlist_ID); // TODO: change limit to amount of members subscribed

  localStorage.setItem("SPOTIFY_INIT_TRACK_TOTAL", playlist.body.tracks.total);
}

//////////////////////////////////////////////////////Check if there are any changes to Spotify Playlist
async function checkSpotifyPlaylist(send) {
  const spotifyApi = await getSpotifyToken();
  message = {};

  ///////////////////////////Get Playlist
  var playlist = await spotifyApi.getPlaylistTracks(config.playlist_ID, {
    offset: localStorage.getItem("SPOTIFY_INIT_TRACK_TOTAL"),
    limit: 50,
  }); // TODO: change limit to amount of members subscribed

  if (playlist.body.items.length > 0) {
    for (song of playlist.body.items) {
      let artists = Object.keys(song.track.artists).map(
        (key) => song.track.artists[key].name
      );

      message.body = `New song added by ${song.added_by.id}:`;
      message.url = song.track.external_urls.spotify;

      try {
        send(message, 4341136652627262);
      } catch (error) {
        console.log(err);
      }

      //old download stuff might use later
      // try {
      //   // await downloadFile(
      //   //   song.track.album.images[0].url,
      //   //   appRoot + "/media/cover.png"
      //   // );
      //   // await downloadFile(
      //   //   song.track.preview_url,
      //   //   appRoot + "/media/preview.mp3"
      //   // );

      //   // message.attachment = [
      //   //   fs.createReadStream(appRoot + "/media/preview.mp3"),
      //   // ];

      //   //send message

      // } catch (err) {
      //   console.Error(err);
      // }

      //console.log(song)
    }
  }

  ///////////////////////////TEMP DATE TIMESTAMPING
  getDate();
}

////////////////////////////////////////////////////// refreshes spotify token if hour passes
async function getSpotifyToken() {
  //initialze object
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  }); //login credentials

  if (
    localStorage.getItem("SPOTIFY_TOKEN_EXPIRE_TIME") === null ||
    Date.now() > parseInt(localStorage.getItem("SPOTIFY_TOKEN_EXPIRE_TIME")) // check if token exists
  ) {
    try {
      let data = await spotifyApi.clientCredentialsGrant();
      localStorage.setItem("SPOTIFY_ACCESS_TOKEN", data.body.access_token);
      localStorage.setItem(
        "SPOTIFY_TOKEN_EXPIRE_TIME",
        Math.floor(Date.now() / 1000) + data.body.expires_in
      );
    } catch (err) {
      throw Error(`Could not get credentials: ${err}`);
    }
  }

  await spotifyApi.setAccessToken(localStorage.getItem(`SPOTIFY_ACCESS_TOKEN`)); //set access token

  return spotifyApi;
}

////////////////////////////////////////////////////// Prints out date of thing
function getDate() {
  let date_ob = new Date();
  let date = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let hours = date_ob.getHours();
  let minutes = date_ob.getMinutes();
  let seconds = date_ob.getSeconds();
  console.log(
    year +
      "-" +
      month +
      "-" +
      date +
      " " +
      hours +
      ":" +
      minutes +
      ":" +
      seconds
  );
}

//should probably figure out why this works but it just does
async function downloadFile(url, path) {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

module.exports = { checkSpotifyPlaylist, initSpotifyPlaylist };
