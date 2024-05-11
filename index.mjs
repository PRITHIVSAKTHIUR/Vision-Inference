import express from "express";
import 'dotenv/config.js'
import { createServer } from "http";
import { Server } from "socket.io";
import { client } from "@gradio/client";
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url);
global.EventSource = require('eventsource');

const app = express();
const httpServer = createServer(app);
app.use(express.static('public'));
const io = new Server(httpServer, { /* options */ });

io.on("connection", (socket) => {
    
    console.log("new socket connection");
    
    socket.on("ask_api", (client_data) => {
        console.log(client_data)
        console.log("trying to reach api");   
        asyncAPICall(client_data, socket)
    });

});

async function test_servers(){
  try{
    const grapi_test = await client("https://gradio-hello-world.hf.space");
    const apitest_result = await grapi_test.predict("/predict", [
      "John",
    ]);
    console.log(apitest_result);
  }
  catch(e){
    console.log(e)
  }
  
}

//test_servers()

async function asyncAPICall(data, socket) {

  const grapi = await client("fffiloni/mndrm-call");
  try{
      const api_result = await grapi.predict("/infer", [
          data[0], 	// blob in 'image' Image component		
          data[1], // string  in 'Question' Textbox component
      ]); 
      console.log(api_result)
      socket.emit("api_response", (api_result.data))
  }
  catch(e){
      console.log(e)
      socket.emit("api_error", ("ERROR ON API SIDE, SORRY..."))
  }    
 
}



httpServer.listen(7860);
console.log("App running on localhost:7860")





