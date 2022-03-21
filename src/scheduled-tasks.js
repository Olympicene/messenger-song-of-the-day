const appRoot = require("app-root-path");
const { getAppState } = require("facebook-chat-api/utils");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const config = require(appRoot + "/database/config.js");
const SpotifyWebApi = require("spotify-web-api-node");
const { resolve } = require("path");
const { send } = require("process");

///////////////////////////Initialize LocalStorage
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require("node-localstorage").LocalStorage;
  localStorage = new LocalStorage("./scratch");
}

//////////////////////////////////////////////////////Initialize Local Storage Vars
async function initSpotifyPlaylist(send) {
  const spotifyApi = await getSpotifyToken();
  message = {};

  ///////////////////////////Get Playlist
  var playlist = await spotifyApi.getPlaylist(config.playlist_ID); // TODO: change limit to amount of members subscribed

  ///////////////////////////Send Greeting Message
  message.body = `Today is a new day, dont forget to add your song to the spotify playlist!`;
  message.url = `https://open.spotify.com/playlist/${config.playlist_ID}`;
  send(message, config.groupchat_ID);

  ///////////////////////////Store and Log
  localStorage.setItem("SPOTIFY_INIT_TRACK_TOTAL", playlist.body.tracks.total);
  console.log(`Spotify Initalize Vars & Greetin: ${getDate()}`);
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

  ///////////////////////////Check if New
  if (playlist.body.items.length > 0) {
    for (song of playlist.body.items) {
      let artists = Object.keys(song.track.artists).map(
        (key) => song.track.artists[key].name
      );

      let userProfile = await getUserProfile(song.added_by.id); //this doesnt scale well deal with it later

      message.body = `New song added by ${userProfile.display_name}:`;
      message.url = song.track.external_urls.spotify;

      try {
        send(message, config.groupchat_ID);
      } catch (error) {
        console.log(err);
      }
    }
  }

  ///////////////////////////Store and Log
  try {
    localStorage.setItem(
      "SPOTIFY_INIT_TRACK_TOTAL",
      playlist.body.tracks.total
    );
  } catch (error) {
    localStorage.setItem("SPOTIFY_INIT_TRACK_TOTAL", playlist.body.total);
  }

  console.log(`Spotify Update Check: ${getDate()}`);
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
    Math.floor(Date.now() / 1000) >
      parseInt(localStorage.getItem("SPOTIFY_TOKEN_EXPIRE_TIME")) // check if token exists
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
  return (
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

//get display name
async function getUserProfile(userID) {
  const response =  await fetch(`https://api.spotify.com/v1/users/${userID}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${localStorage.getItem(`SPOTIFY_ACCESS_TOKEN`)}`,
      "Content-Type": "application/json",
    },
  });
  const formatted = await response.json();
  return formatted;
}

module.exports = { checkSpotifyPlaylist, initSpotifyPlaylist, getDate };
