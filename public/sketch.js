let myCanvas
const arrows = []
let current_points = []
let t_size
let button
let isOnCanvas = false;
let socket;
let live = false;
let timer;
let capture;
let instructions;
let current_instructions;
let messages_list = []
let timerWaiting;
let waiting = false;

let active_rearcam = false;
let camConfig = "user";
let isOnMobile;
let camIsON = false;
let device_orientation;

let graphicsToSend;

function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}

//-----------------------------------------------------
//-----------------------------------------------------

function preload(){

    isOnMobile = isMobileDevice()
    console.log("is on mobile ? " + isOnMobile)

    if(isOnMobile){
      device_orientation = screen.orientation.type;
    }


    
    // Socket events handlers
    socket = io();
    // client-side
    socket.on("connect", () => {
        console.log(socket.id);
    });
    
    socket.on("hello", (arg) => {
        let api_data_test = arg[1]
        console.log(api_data_test) 
    });  

    socket.on("api_error", (arg) => {
        let message = arg
        console.log(message) 
    }); 
    // ————————
}

function call_api(socket, instructions){
    console.log("Calling API ... ")
    waiting = true;
    show_loading()
    //cnv_data = myCanvas.elt.toDataURL('image/png');
    graphicsToSend.loadPixels()
    cnv_data = graphicsToSend.canvas.toDataURL('image/png');
    let data = [
        cnv_data,
        instructions
    ]
    socket.emit("ask_api", data);
}

function windowResized() {
    if(windowWidth <= 500){
        resizeCanvas(380, 380*320/576);
    } else {
        resizeCanvas(576, 320);
    }
}

function setup() {

    screen.orientation.addEventListener("change", function(e) {
      device_orientation = screen.orientation.type
      console.log(device_orientation)
      if(camIsON){
                if(capture){
                    capture.remove()
                    capture = undefined
                  }
            
                  if(active_rearcam == true){
                    let new_constraints = {
                          audio: false,
                          video: {
                            facingMode:  {
                              exact: "environment"
                            }
                          }    
                        };
                    capture = createCapture(new_constraints)
                    capture.hide()
                  } else {
                    let new_constraints = {
                          audio: false,
                          video: {
                            facingMode:  "user"
                          }
                          //video: {
                            //facingMode: "user"
                          //} 
                        };
                    capture = createCapture(new_constraints)
                    capture.hide()
                  }
                }
    });
    pixelDensity(1)
    if(windowWidth <= 500){
        myCanvas = createCanvas(380, 380*320/576);
        
    } else {
        myCanvas = createCanvas(576, 320);
        
    }
    background(220)
    myCanvas.id('myCanvas')
    myCanvas.parent("canvas-container")

    graphicsToSend = createGraphics(myCanvas.width, myCanvas.height)

    socket.on("api_response", (response) => {
        waiting = false;
        clearTimeout(timerWaiting)
        
        
        vision_text = response[0]
        console.log(vision_text)
        messages_list.push(vision_text)
 
        if(live === true){
            loadingDiv = document.getElementById("loading-div")
            loadingDiv.innerHTML = "_"
            display_messages()
            console.log("Sending new requestion in 3 seconds")
            
            timer = setTimeout(() => {
                console.log(current_instructions)
                call_api(socket, current_instructions)
            }, 3000)
        }
    });
    
    // Watch if cursor is above canvas or not
    let getCanvas = document.getElementById('myCanvas');

    getCanvas.addEventListener("pointerdown", (e) => {
        //console.log("pointerDown");
        getCanvas.setPointerCapture(e.pointerId);
        isOnCanvas = true;
    }, false);

    getCanvas.addEventListener("pointerup", (e) => {
        //console.log("pointerUp");

        if (isOnCanvas) {
        getCanvas.releasePointerCapture(e.pointerId);
        isOnCanvas = false;
        }
    }, false);
    //—————————
  
    // Buttons 
    start_capture_button=createButton("turn on cam")
    start_capture_button.mousePressed(() => {
        camIsON = true;
        if(!active_rearcam){
            camConfig = "user"
        } else {
            camConfig = {
                exact: "environment"
            }
        }
        let constraints = {
            audio: false,
            video: {
              facingMode:  camConfig
            }    
          };
        capture = createCapture(constraints);
        capture.hide();
    })

    if(isOnMobile){
        checkbox_rearcam = createCheckbox("switch to rear cam");
        checkbox_rearcam.parent("checkbox-rear");
    
        checkbox_rearcam.mousePressed( () => {
          
            if(active_rearcam == false){
                active_rearcam = true;
            } else {
                active_rearcam = false
            }
            
            if(camIsON){
                if(capture){
                    capture.remove()
                    capture = undefined
                  }
            
                  if(active_rearcam == true){
                    let new_constraints = {
                          audio: false,
                          video: {
                            facingMode:  {
                              exact: "environment"
                            }
                          }    
                        };
                    capture = createCapture(new_constraints)
                    capture.hide()
                  } else {
                    let new_constraints = {
                          audio: false,
                          video: {
                            facingMode:  "user"
                          }
                          //video: {
                            //facingMode: "user"
                          //} 
                        };
                    capture = createCapture(new_constraints)
                    capture.hide()
                  }
                }
            })
          
    }
    
    start_button = createButton('start live vision');
    start_button.mousePressed(() => {
        live = true;
        current_instructions = input_instructions.value()
        console.log("Live in ON")
        console.log(current_instructions)
        call_api(socket, current_instructions)
    })
    
    stop_button = createButton('stop all');
    stop_button.mousePressed(() => {
        live = false;
        waiting = false;
        // Abort the timer
        clearTimeout(timer);
        clearTimeout(timerWaiting)
        loadingDiv.innerHTML = "_"
        if(capture){
            capture.remove();
            capture = undefined
            camIsON = false;
        }
        console.log("live is OFF")
        //redraw()
    })
    
    input_instructions = createInput("What is happening ? ")

    change_instructions = createButton("change instructions")
    change_instructions.mousePressed(() => {
        current_instructions = input_instructions.value()
    })

    start_capture_button.parent("buttons-container")
    start_button.parent("buttons-container")
    stop_button.parent("buttons-container")
    input_instructions.parent("instructions-container")
    change_instructions.parent("instructions-container")

    loadingDiv = document.getElementById("loading-div")

}

function draw() {
    background(220);
    textAlign(CENTER);
    text('turn on your webcam', width/2, height/2);
    
    if(capture != undefined){
      
      if(!active_rearcam){
          
        
        if(isOnMobile){
          if(device_orientation == "portrait" || device_orientation == "portrait-primary" || device_orientation == "portrait-secondary"){
            graphicsToSend.image(capture,(myCanvas.width/2)-(capture.width/2), -(capture.height/4))
            push()
          //move image by the width of image to the left
            translate(myCanvas.width, 0);
          //then scale push()
          //move image by the width of image to the left
          //to flip the image
            scale(-1, 1);
            image(capture,(myCanvas.width/2)-(capture.width/2), -(capture.height/4))
            pop()
          } else {
            graphicsToSend.image(capture, 0, 0)
            push()
          //move image by the width of image to the left
          translate(myCanvas.width, 0);
          //then scale push()
          //move image by the width of image to the left
          //to flip the image
            scale(-1, 1);
            image(capture, 0, 0)
            pop()
          }
        } else {
          graphicsToSend.image(capture, 0, 0)
          push()
          //move image by the width of image to the left
          translate(myCanvas.width, 0);
          //then scale push()
          //move image by the width of image to the left
          //to flip the image
          scale(-1, 1);
          image(capture, 0, 0)
          pop()
        }          
      
      } else {
          if(isOnMobile){
            if(device_orientation == "portrait" || device_orientation == "portrait-primary" || device_orientation == "portrait-secondary"){
              graphicsToSend.image(capture,(myCanvas.width/2)-(capture.width/2), -(capture.height/4))
              image(capture,(myCanvas.width/2)-(capture.width/2), -(capture.height/4))
            } else {
                graphicsToSend.image(capture, 0, 0)
                image(capture, 0, 0)
              
              
            }
          } else {
            graphicsToSend.image(capture, 0, 0)
            image(capture, 0, 0)
          }
      }
    
    }
}

function display_messages(){
    visionDiv = document.getElementById("vision-text-container")
    visionDiv.innerHTML = ""
    //for(i=0; i < messages_list.length - 1; i++){
    //    newNode = document.createElement('div');
    //    newNode.classList.add('text-msg')
    //    newNode.innerHTML = messages_list[i]; 
    //    visionDiv.appendChild(newNode);  
    //}
    newNode_last = document.createElement('div'); 
    newNode_last.classList.add('text-msg')
    visionDiv.appendChild(newNode_last);
    const text_msg = messages_list[messages_list.length - 1]
    const words = text_msg.split(" "); // splits the text into an array of words

    // Function that returns a promise which resolves after a specified number of milliseconds
    function wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function streamText(words) {
        for (let word of words) {
            //console.log(word);
            newNode_last.innerHTML += " " + word;
            //visionDiv.scrollTop = visionDiv.scrollHeight;
            await wait(30); // Wait for 1 second before logging next word
        }
    }

    streamText(words);
    
}

function clean(){
    if(waiting == true){
        loadingDiv.innerHTML = ""
        timerWaiting = setTimeout(show_loading, 500)
    } else {
        loadingDiv.innerHTML = "_"
    }
    
}

function show_loading(){
    
    if(waiting == true){
        loadingDiv.innerHTML = ""
        loading_text = ". . ."
    } else {
        loading_text = "_"
    }
    
    const dots = loading_text.split(" "); // splits the text into an array of words

    // Function that returns a promise which resolves after a specified number of milliseconds
    function wait(ms) {
        if(waiting == true){
            
            return new Promise((resolve) => resolveTimer = setTimeout(resolve, ms));
        } else {
            clearTimeout(resolveTimer)
            loadingDiv.innerHTML = "_"
        }
        
    }

    async function streamDots(words) {
        
        if(waiting == true){
            
            for (let word of words) {
                //console.log(word);
                loadingDiv.innerHTML += " " + word;
                //visionDiv.scrollTop = visionDiv.scrollHeight;
                await wait(500); // Wait for 1 second before logging next word
            }
        
            
            //console.log("ENLEVE")
            
            //timerWaiting = setTimeout(show_loading, 500)
            clean()
        } else {
            clearTimeout(timerWaiting)
            //loadingDiv.innerHTML = "_"
        }
    }

    streamDots(dots);
    
    
}
