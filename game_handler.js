//import class file
import { GameObject, Interactable, Drawing, Platform } from "./classes.js";
//defining constants
const WINDOW_WIDTH = window.innerWidth;
const WINDOW_HEIGHT = window.innerHeight;
const GROUND_HEIGHT = 70;
const LEFT_ROOM_SWITCH = 40;
const RIGHT_ROOM_SWITCH = WINDOW_WIDTH - LEFT_ROOM_SWITCH;
const PLAYER_WIDTH = 64 * 1.5;
const PLAYER_HEIGHT = 64 * 1.5;
const DIST_X_CX = PLAYER_WIDTH * 0.25;
const DIST_Y_CY = PLAYER_HEIGHT * 0.12;
//caching sprites
let pRunFrames = [];
for(let i = 0; i < 7; i++){
    pRunFrames.push(new Image());
    pRunFrames[i].src = "assets/player/player_run/player_run" + i + ".png";
}
let pStandFrames = [];
for(let i = 0; i < 3; i++){
    pStandFrames.push(new Image());
    pStandFrames[i].src = "assets/player/player_stand/player_stand" + i + ".png";

}
//defining my vars associated with the camera, room and drawing
let roomContainer;
let camera = new Array(2);
let cameraWidth = WINDOW_WIDTH;
let cameraHeight = WINDOW_HEIGHT;
let context = new Array(2); //?
let gameFrameNum = 0;
let music = new Audio("./assets/music/8bChillReg.mp3");
//actual room info
let roomState = 0;
let roomTransition = {
        state : 0,
        x : 0
    };
let objList = [];

////for key input (used for character movement)
let keys = {}; 


//player dims

//init player pos
let playerX = cameraWidth / 2;
let playerY = cameraHeight - GROUND_HEIGHT - 80;

//player struct thingy
let player = {
    x : playerX,
    y : playerY,
    width : PLAYER_WIDTH,
    height : PLAYER_HEIGHT,
    colBox : {
        x : playerX + DIST_X_CX,
        y : playerY + DIST_Y_CY,
        width : PLAYER_WIDTH*0.5,
        height : PLAYER_HEIGHT *0.82
    },
    state : 0,
    img : new Image(),
    frame : 0,
    relGameFrame : 0
}

let xVel = 0;
let yVel = 0;
let isFalling = 1;

window.onload = function(){
    camera[0] = document.getElementById("camera");
    camera[1] = document.getElementById("transitionCamera");
    for(let i = 0; i < 2; i++){
        camera[i].width = cameraWidth;
        camera[i].height = cameraHeight;
        context[i] = camera[i].getContext("2d");
    }
    //drawing the player initially (need to use images later on)
    for(let i = 0; i < 11; i++){

        let px = i * WINDOW_WIDTH / 10;
        let py = cameraHeight - GROUND_HEIGHT + 30;
        // console.log(px + " " + py);
        if(i < 10)
            objList.push(new Platform("floor"+i, "grass.png", px, py, WINDOW_WIDTH/10, GROUND_HEIGHT - 30));
        else
            objList.push(new Platform("platform", "grass.png", 150, WINDOW_HEIGHT - GROUND_HEIGHT - 150, 100, 50));
    }
    loadRoom();
    // context[0].fillRect(player.x, player.y, player.width, player.height);
    detPlayerImg();
    player.img.onload = function(){
        drawPlayer();
        
    };
   requestAnimationFrame(update);
   document.addEventListener("keydown", updateKeysDown);
   document.addEventListener("keyup", updateKeysUp);
}

function update(){ //used for updating frames
    requestAnimationFrame(update);
    if(!roomTransition.state){
        loadRoom();
        player.x += xVel;
        player.colBox.x += xVel;
        player.y += yVel;
        player.colBox.y += yVel;
        for(let i = 0 ; i < objList.length; i++)
            detectCollision(objList[i]);
        // isFalling = (player.y < cameraHeight - GROUND_HEIGHT)? 1 : 0; //if not touching ground
        movePlayer();
        detPlayerImg();
        if (player.img.complete) {
            drawPlayer();
        } else {
            player.img.onload = drawPlayer;
        }
        
        detEndOfRoom();
    }
    else{ //transition animaton
        let bufferPiece = WINDOW_WIDTH / 25;
        switch(roomTransition.state){
            case 1:
                context[1].fillStyle = 'rgb(0,0,0)';
                context[1].fillRect(roomTransition.x, 0, bufferPiece, WINDOW_HEIGHT);
                context[1].fillRect(WINDOW_WIDTH - roomTransition.x, 0, bufferPiece, WINDOW_HEIGHT);
                roomTransition.x += bufferPiece - 2;
                if(roomTransition.x >= 2 * WINDOW_WIDTH / 3){
                    context[0].clearRect(0, 0, cameraWidth, cameraHeight);
                    loadRoom(); //loading the drawings
                    roomTransition.x = (cameraWidth / 2) - bufferPiece;
                    roomTransition.state = 2;
                }
                break;
            case 2:
                context[1].clearRect(roomTransition.x, 0, bufferPiece, WINDOW_HEIGHT);
                context[1].clearRect(WINDOW_WIDTH - roomTransition.x - bufferPiece, 0, bufferPiece, WINDOW_HEIGHT);
                roomTransition.x -= bufferPiece - 2;
                if(roomTransition.x < 0){
                    context[1].clearRect(0, 0, cameraWidth, cameraHeight);
                    roomTransition.x = 0;
                    roomTransition.state = 0;
                }
        }
    }    
    updateGameFrame();
    // console.log("Crashing?\n");
}

//PLAYER MOVEMENT FUNCTIONS
function updatePlayerState(){
    let oldPlayerState = player.state;
    if(!isFalling){
        player.state = (keys["left"] || keys["right"])? 1 : 0;
    } 
    else
        player.state = 0;
    //if player state got updated, set the frames back
    if(oldPlayerState ^ player.state){ //if there is change in player state
        // player.frame = 0;
        player.relGameFrame = 0;
    }
}

function movePlayer(){
    if(keys["left"]) //if left down
    {
        xVel = -cameraWidth * 0.005;
    }
    else if(keys["right"]){ //if right down
        xVel = cameraWidth * 0.005;
    }
    else{
        xVel = 0;
    }
    if(isFalling){ //if falling (grav)
        yVel += 0.5;
        // player.state = 0; //for now
    }
    else if(keys["up"]){ //if not falling(grounded) and pressed key up
        yVel = -cameraHeight * 0.015;
        isFalling = 1;
        // player.state = 0; 
    }
    else{
        yVel = 0;
    }
    //     player.y = cameraHeight - GROUND_HEIGHT; //make player at baseline
    // }
    updatePlayerState();
}


function updateKeysDown(e){
    // clickX = e.clientX;
    // clickY = e.clientY;
    // clickedOn = 1;
    // console.log(clickX + ", " + clickY + ", " + xVel);
    if(e.code == "ArrowLeft" || e.code == "KeyA"){
        keys["left"] = true;
        // console.log("Left down!\n");
    }
    else if(e.code == "ArrowRight" || e.code == "KeyD"){
        keys["right"] = true;
        // console.log("Right down!\n");
    }
    else if((e.code == "ArrowUp" || e.code == "KeyW")){ //do not allow jumping
        keys["up"] = true;
        // console.log("Up (pressed) down!\n");
    }
    // else{
    //     xVel = 0;
    //     console.log("Nothing\n");
    // }    
}

function updateKeysUp(e){ //tracks when movement key is lifted
    if(e.code == "ArrowLeft" || e.code == "KeyA"){
        keys["left"] = false;
        // console.log("Left down!\n");
    }
    else if(e.code == "ArrowRight" || e.code == "KeyD"){
        keys["right"] = false;
        // console.log("Right down!\n");
    }
    else if((e.code == "ArrowUp" || e.code == "KeyW")){
        keys["up"] = false;
        // console.log("Up (pressed) down!\n");
    }
}

//ROOM DETERMINATION AND ROOM-BASED DRAWING
function detEndOfRoom(){
    let hitLeftBorder = player.colBox.x < LEFT_ROOM_SWITCH;
    let hitRightBorder = player.colBox.x + player.colBox.width > RIGHT_ROOM_SWITCH;
    let oldXVel = xVel;
    roomTransition.state = 1;
    xVel = 0;
    //handling border collisions
    if(hitLeftBorder){
        player.x = RIGHT_ROOM_SWITCH - (player.width + 10);
        roomState -= 1;
    }
    else if(hitRightBorder){
        player.x = LEFT_ROOM_SWITCH + 10;
        roomState += 1;
    }
    else{
        roomTransition.state = 0;
        xVel = oldXVel;
        return;
    }
    //now logic with rooms
    if(roomState === -1) //went to left of left room (no roomTransition.state)
        roomState = 2; //go to room 2
    if(roomState === 3)
        roomState = 0;
}

function loadRoom(){
    context[0].clearRect(0, 0, cameraWidth, cameraHeight);
    for(let i = 0; i < objList.length; i++){
        // console.log("Drawing:" + objList[i].x + " " + objList[i].y + " " + objList[i].width + 
        //     " " + objList[i].colBox.x + " " + objList[i].colBox.y + " " + objList[i].colBox.width);
        objList[i].draw(context[0]);//draw all objects
    }
    // console.log("Loading room " + roomState);
}

function updatePlayerFrame(){
    let f = player.relGameFrame;
    switch(player.state){
        case 0:
            if(f < 114)
                player.frame = 0;
            else if (f < 117)
                player.frame = 1;
            else
                player.frame = 2;
            break;
        case 1:
            player.frame = Math.floor(f / 6);
            break;
    }
    console.log("f: " + player.state);
}

function detPlayerImg(){
    updatePlayerFrame();
    let f = player.frame;
    if(!player.state){
        player.img = pStandFrames[f];
    }
    else
        player.img = pRunFrames[f];
}

function drawPlayer(){
    let ctx = context[0];
    let flip = xVel < 0;
    ctx.save();
    if(flip){
        ctx.translate(player.x + player.width, player.y);
        ctx.scale(-1, 1); // Mirror horizontally
        ctx.drawImage(player.img, 0, 0, player.width, player.height);
    }else{
        ctx.translate(player.x, player.y);
        ctx.drawImage(player.img, 0, 0, player.width, player.height);
    }
    ctx.restore();
    // ctx.fillStyle = 'rgba(100,100,100,0.7)';
    // ctx.fillRect(player.colBox.x, player.colBox.y, player.colBox.width, player.colBox.height); (col box)
    // ctx.fillStyle = 'rgba(255,0,140,0.1)';
    // ctx.fillRect(player.x, player.y, player.width, player.height); //for debugging purposes (img box)
}

//COLLISION CODE
function detectCollision(obj){
    let hIntersect = intersect(player.colBox.x, player.colBox.x + player.colBox.width, obj.colBox.x, obj.colBox.x + obj.colBox.width);
    let vIntersect = intersect(player.colBox.y, player.colBox.y + player.colBox.height, obj.colBox.y, obj.colBox.y + obj.colBox.height);
    if(hIntersect != 0 && vIntersect != 0 && obj.solid){
        if(Math.abs(hIntersect) <= Math.abs(vIntersect)){
            if(player.colBox.x < obj.colBox.x){//if player on left side of object
                console.log("Colliding left");
                // xVel = 0;
                player.colBox.x = obj.colBox.x - player.colBox.width - 1;//gives slight buffer
                player.x = player.colBox.x -  DIST_X_CX;
            }
            if(player.colBox.x + player.colBox.width > obj.colBox.x + obj.colBox.width){
                console.log("Colliding right");
                // xVel = 0;
                player.colBox.x = obj.colBox.x + obj.colBox.width - 1;
                player.x = player.colBox.x - DIST_X_CX;
            }
        }
        else if(player.colBox.y < obj.colBox.y){//on top of colBox
            console.log("Colliding top");
            // yVel = 0;
            player.colBox.y = obj.colBox.y - player.colBox.height - 1;
            player.y = player.colBox.y - DIST_Y_CY;
            isFalling = 0;
        }
        else{ //on bottom of colBox (hit head)
            console.log("Colliding bottom");
            yVel = yVel > 0? yVel: 0;
            player.colBox.y = obj.colBox.y + obj.colBox.height + 1;
            player.y = player.colBox.y - DIST_Y_CY;
            isFalling = 1;//need to set fallicolBoxng physics stuff
        }
    }
    return(hIntersect != 0) && (vIntersect != 0); //just a return val for general collisions (not necessarily solid collisions)
}

function intersect(left1, right1, left2, right2){ //have [a,b] [c,d]
    if((left1 < right2) && (right1 > left2)){
        if(left1 < left2){ //a < c
            if(right1 < right2) // a < c < b < d
                return right1 - left2;
            else //a < c < d < b
                return right2 - left2;
        }
        else{
            if(right1 < right2) //c < a < b < d
                return right1 - left1;
            else //c < a < d < b
                return right2 - left1;
        }
    }
    else // a < b < c < d OR c < d < a < b
        return 0;
}

//INTERACTION

// function interactWithObj(obj){
//     if(obj.type === "interactable" && keys[""])
// }

//GAME FRAME STUFF
function updateGameFrame(){
    gameFrameNum = (++gameFrameNum) % 60;
    if(player.state)
        player.relGameFrame = (++player.relGameFrame) % 42;
    else
        player.relGameFrame = (++player.relGameFrame) % 120;
}
