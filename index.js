'use strict';

require("dotenv").config()
const express = require('express')
const CharacterAI = require('node_characterai');
const characterAI = new CharacterAI();

const app = express()
app.use(express.json());

async function setup() {
    characterAI.requester.usePlus = true;
    characterAI.requester.forceWaitingRoom = false;
    characterAI.requester.puppeteerLaunchArgs = ['--no-sandbox', '--disable-setuid-sandbox']
    await characterAI.authenticateWithToken(process.env.ACCESS_TOKEN);
    app.post('/chat', async (req, res) => {
        const chat = await characterAI.createOrContinueChat(process.env.CHARACTER_ID);
        const response = await chat.sendAndAwaitResponse(req.body.text, true)
        res.status(200).json(response.text);
    })
    app.listen(process.env.PORT || 3000, () => console.log("Application is now listening on port: " + process.env.PORT));
}

setup()