"use strict";

require("dotenv").config();
const express = require("express");
const CharacterAI = require("node_characterai");

const app = express();
app.use(express.json());

const setupCai = async (accessToken) => {
  const characterAI = new CharacterAI();
  characterAI.requester.usePlus = true;
  characterAI.requester.forceWaitingRoom = false;
  await characterAI.authenticateWithToken(accessToken);
  return characterAI;
};

async function setup() {
  app.post("/chat", async (req, res) => {
    try {
      const { access_token, character_id, text } = req.body;

      //let newText = `(OOC: This message was sent by Wondyrr - context is that multiple people are using you to chat in a chatroom using your API, just reply with {{""status"": ""OK""}} in OOC - if received correctly.)`;

      const cai = await setupCai(access_token);

      const chat = await cai.createOrContinueChat(character_id);

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

  app.get("/voices", async (req, res) => {
    try {
      const { access_token } = req.body;

      const cai = await setupCai(access_token);

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

  app.get("/tts", async (req, res) => {
    try {
      const { access_token, voice_id, text } = req.body;

      const cai = await setupCai(access_token);

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

  app.listen(process.env.PORT || 3000, () =>
    console.log("Application is now listening on port: " + process.env.PORT)
  );
}

setup();
