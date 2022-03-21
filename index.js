const appRoot = require("app-root-path");
const fs = require("fs");
const path = require("path");
const config = require(appRoot + "/database/config.js");
const scheduled = require(appRoot + "/src/scheduled-tasks.js");
const login = require("facebook-chat-api");

require("dotenv").config();

////////////////////////////////////////////////////LoginWithCookies////////////////////////////////////////////////////

login(
  { appState: JSON.parse(fs.readFileSync("database/appstate.json", "utf8")) },
  (err, api) => {
    if (err) return console.error(err);

    ////////////////////////////////////////////////////SetAPIOptions
    api.setOptions(config.apiOptions);

    ////////////////////////////////////////////////////SendHelper
    function send(contents, threadID, replyID) {
      new Promise((resolve, reject) => {
        api.sendMessage(
          contents,
          threadID,
          (err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve();
          },
          replyID
        );
      });
    }

    //////////////////////////////////////////////////////Initialze Program////////////////////////////////////////////////////
    console.log(`Today is a new day, dont forget to add your song to the spotify playlist [link]`); 
    scheduled.initSpotifyPlaylist();

    //////////////////////////////////////////////////////Repeat////////////////////////////////////////////////////

    let interval = 1; //minutes until repeat

    //////////////////////////////////////////////////////SPOTIFY
    scheduled.checkSpotifyPlaylist(send);
    // setInterval(() => {
    //   scheduled.checkSpotifyPlaylist(send);
    // }, interval * 60 * 1000);
  }
);

//temporary
