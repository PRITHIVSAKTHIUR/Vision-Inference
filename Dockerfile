FROM node:latest

COPY . .

RUN npm install
CMD node index.mjs
