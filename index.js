const path=require('path');
// const http=require("http");
// const {Server}=require("socket.io");
// const socketio = require('socket.io');

// const server=http.createServer(app);

// const io=new Server(server)
// app.use(express)


const express = require('express');
const app = express();
const http = require('http');

const port=process.env.PORT || 3000;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const mongoose=require("mongoose");
const Room=require('./models');
const messages=[]



app.get('/',function(req,res){
    var option={
      root:path.join(__dirname)
    }
    var filename='index.html';
    res.sendFile(filename,option);
});

// var clients = 0;
var roomno = 1;
var full=0;

io.on('connection',async (socket) => {
  console.log('a user connected');
  
  const name=socket.handshake.query.name;
 await socket.on('message',(data)=>{
    const mess={
        message:data.message
    }
    messages.push(mess);
  console.log(messages); 
  })

  function generateRandom4DigitNumber() {
    const min = 1000;
    const max = 9999;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber;
  }
  
  
  // console.log(random4DigitNumber);

  socket.on('createRoom',async ({nickname,gameID})=>{
    nickname=nickname.toString();
    gameID=parseInt(gameID);
    try{
    let room=new Room();
    let player={
      socketID:socket.id,
      nickname,
      playerType:'X',
    };
    room.socketId=socket.id;
    room.players.push(player);
    room.turn=player;
    room.gameID=gameID;
    socket.join(gameID.toString());
    room=await room.save();
    console.log(room);
    const roomID=room._id.toString();
    socket.join(gameID.toString());
    console.log(roomID,gameID);
    io.to(gameID).emit('createdRoom',room);
  }catch(e){
    console.log(e);
  }
    console.log(nickname);
  })

  socket.on('joinRandom',async({nickname})=>{
    full+=1;
    nickname=nickname.toString();
    var gameID = roomno;
    if(full%2==0){
      try{
          let room=await Room.findOne({ gameID: parseInt(gameID) });
            if (room) {
              console.log('User found:');
            } else {
              console.log('User not found.');
              return
            }
    gameID=gameID.toString();
          if(room.isJoin){
            let player={
              nickname,
              socketID:socket.id,
              playerType:'O'
            }
            socket.join(gameID.toString());
            // room.socketId=socket.id;
            room.players.push(player);
            console.log(room);
            room=await room.save();
            io.to(gameID.toString()).emit('RoomJoin',room);
          }
          console.log('Joined');
        }catch(e){
        console.log(e);
        }
      roomno+=1;
    }
    else{
    //generateRandom4DigitNumber();
    try{
      let room=new Room();
      let player={
        socketID:socket.id,
        nickname,
        playerType:'X',
      };
      room.socketId=socket.id;
      room.players.push(player);
      room.turn=player;
      room.gameID=gameID;
      socket.join(gameID.toString());
      room=await room.save();
      console.log(room);
      const roomID=room._id.toString();
      socket.join(gameID.toString());
      console.log(roomID,gameID);
      io.to(gameID.toString()).emit('createdRoom',room);
    }catch(e){
      console.log(e);
    }}
    console.log(nickname);
    // gameID=parseInt(gameID);
  });
    


var RoomID1;

  socket.on('joinRoom',async({nickname,roomid})=>{
    try{
    //  if(!roomid.match('/[0-9a-fA-F]{24}$/')){

    //  }

      // let room =await Room.findById(roomid);
      let room=await Room.findOne({ gameID: parseInt(roomid) });
        
        if (room) {
          console.log('User found:', room);
        } else {
          console.log('User not found.');
          return
        }

      if(room.isJoin){
        let player={
          nickname,
          socketID:socket.id,
          playerType:'O'
        }
        socket.join(roomid);
        // room.socketId=socket.id;
        room.players.push(player);
        console.log(room);
        room=await room.save();
        io.to(roomid).emit('RoomJoin',room);
      }

    }catch(e){
    console.log(e);
    }

  });

  // socket.join("room-"+roomno);
  // io.sockets.in("room-"+roomno).emit('connectToRoom', "You are in room no. "+roomno);
  // full++;
  // console.log(full);
  // if(full%2==0){
  //   roomno++;
  // }
  // clients++;
  // io.sockets.emit('broadcast',{ description: clients + ' clients connected!'});
  
 


socket.on('sendmessage',function(data){
  const {sendmessage,roomid}=data;
  console.log(roomid,sendmessage);
  io.to(roomid.toString()).emit('receiveMessage',sendmessage);
});

 
  // socket.on('disconnect', function () {
    // clients--;
    // io.sockets.emit('broadcast',{ description: clients + ' clients connected!'}); 
    // console.log('A user disconnected');
//  });
 
 

 socket.on('disconnect', async () => {
  console.log('User disconnected.');

  try {
    // Delete data from MongoDB when the user disconnects
    // const player=await Room.findOne({'players.playerType':'X','players.socketID':socket.id});
    // console.log('create',player);,'players.playerType':'X'
    const deletedUser = await Room.findOneAndDelete({ socketId: socket.id });
    if (deletedUser) {
      roomno-=1;
      // console.log('Deleted User:', deletedUser);
    } else {
      console.log('User not found.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
});



});

app.use(express.json());
const DB='mongodb+srv://logsak25:abishekdeepak@abishekdb.55wn9ig.mongodb.net/?retryWrites=true&w=majority'
 
mongoose.connect(DB).then(()=>{ 
  console.log("connect success");
}).catch((e)=>{
console.log("Failed");
});

server.listen(port,'0.0.0.0', () => {
  console.log('listening on',port);
});

// mongodb+srv://logsak25:<password>@abishekdb.55wn9ig.mongodb.net/?retryWrites=true&w=majority





//   setTimeout(function(){
//     socket.send('Sent a message 4seconds after connection!');
//     console.log("Called");
//  }, 4000);

