const fs = require("fs");
const path = require("path");
const config = require("./database/config.js");
const login = require("facebook-chat-api");
const { Console } = require("console");

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
        api.sendMessage(contents, threadID, (err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve(`message sent`);
          }, replyID);
      });
    }

    ////////////////////////////////////////////////////ErrorHelper
    function error(errorMessage, threadID, replyID) {
      contents = {};
      contents.body = errorMessage;
      console.log(errorMessage);
    
      new Promise((resolve, reject) => {
        api.sendMessage(contents, threadID, (err) => {
          if (err) {
            reject(err);
            return;
          }
    
          resolve();
        }, replyID);
      });
    }

    // ////////////////////////////////////////////////////Restart_Notification////////////////////////////////////////////////////
    // console.log(`Today is a new day, dont forget to add your song to the spotify playlist [link]`); // probably only send if it around midnight

    // ////////////////////////////////////////////////////Repeat////////////////////////////////////////////////////

    // let interval = 1; //minutes until repeat

    // setInterval(() => {
    //     let date_ob = new Date();
    //     let date = ("0" + date_ob.getDate()).slice(-2);
    //     let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    //     let year = date_ob.getFullYear();
    //     let hours = date_ob.getHours();
    //     let minutes = date_ob.getMinutes();
    //     let seconds = date_ob.getSeconds();
    //     console.log(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
    // }, interval * 60 * 1000);

  }
);
