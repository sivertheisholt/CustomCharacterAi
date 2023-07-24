FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

RUN sudo apt-get install
    && apt install libnss
    && apt install libnss3-dev libgdk-pixbuf2.0-dev libgtk-3-dev libxss-dev

COPY . .

EXPOSE 3000
CMD [ "node", "index.js" ]