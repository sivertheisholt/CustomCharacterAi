"use strict";

require("dotenv").config();
const express = require("express");
const CharacterAI = require("node_characterai");

const app = express();
app.use(express.json());

const characterAI = new CharacterAI();
let characterId = "";
let chat;

const setupCai = async (accessToken) => {
  try {
    if (characterAI.isAuthenticated()) return characterAI;
    characterAI.requester.puppeteerPath = "/usr/bin/google-chrome";
    await characterAI.authenticateWithToken(accessToken);
    return characterAI;
  } catch (err) {
    console.log("Could not setup CAI: " + err);
    return null;
  }
};

async function setup() {
  app.get("/health", async (req, res) => {
    try {
      const accessToken = req.headers.authorization;
      const cai = await setupCai(accessToken);

      if (cai == null) return res.status(500).send("Invalid token");

      return res.status(200).send();
    } catch (err) {
      return res
        .status(500)
        .send(
          "Something wrong happen when trying to connect with Character AI" +
            err
        );
    }
  });

  app.post("/chat", async (req, res) => {
    try {
      const accessToken = req.headers.authorization;
      const { character_id, text } = req.body;

      //let newText = `(OOC: This message was sent by Wondyrr - context is that multiple people are using you to chat in a chatroom using your API, just reply with {{""status"": ""OK""}} in OOC - if received correctly.)`;

      const cai = await setupCai(accessToken);

      if (characterId != character_id) {
        chat = await cai.createOrContinueChat(character_id);
        characterId = character_id;
      }

      const response = await chat.sendAndAwaitResponse(text, true);

      return res.status(200).json(response.text);
    } catch (err) {
      return res
        .status(500)
        .send(
          "Something wrong happen when trying to connect with Character AI" +
            err
        );
    }
  });

  app.post("/tts", async (req, res) => {
    try {
      const accessToken = req.headers.authorization;
      const { voice_id, text } = req.body;

      const cai = await setupCai(accessToken);

      const base64 = await cai.fetchTTS(voice_id, text);

      return res.status(200).json(base64);
    } catch (err) {
      return res
        .status(500)
        .send(
          "Something wrong happen when trying to connect with Character AI" +
            err
        );
    }
  });

  app.get("/voices", async (req, res) => {
    try {
      const accessToken = req.headers.authorization;

      const cai = await setupCai(accessToken);

      const voices = await cai.fetchTTSVoices();

      if (voices == undefined)
        return res.status(404).send("Could not find any voices");

      return res.status(200).json(voices);
    } catch (err) {
      return res
        .status(500)
        .send(
          "Something wrong happen when trying to connect with Character AI" +
            err
        );
    }
  });

  app.listen(process.env.PORT || 3000, () =>
    console.log("Application is now listening on port: " + process.env.PORT)
  );
}

setup();
