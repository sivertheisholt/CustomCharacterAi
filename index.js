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

      const cai = await setupCai(accessToken);
      if (cai == null) return res.status(500).send("CAI is not authenticated");

      if (characterId != character_id) {
        const newChat = await cai.createOrContinueChat(character_id);
        if (newChat instanceof Error)
          return res.status(500).send("Something went wrong");

        chat = newChat;
        characterId = character_id;
      }

      const response = await chat.sendAndAwaitResponse(text, true);
      if (response instanceof Error)
        return res.status(500).send("Something went wrong");

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
      if (cai == null) return res.status(500).send("CAI is not authenticated");

      const base64 = await cai.fetchTTS(voice_id, text);
      if (base64 instanceof Error)
        return res.status(500).send("Something went wrong");

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
      if (cai == null) return res.status(500).send("CAI is not authenticated");

      const voices = await cai.fetchTTSVoices();
      if (voices instanceof Error)
        return res.status(500).send("Something went wrong");

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
