const path = require('path');
const express = require('express');
const app = express();
const http = require('http');
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const mongoose = require("mongoose");
const Room = require('./models');
app.get('/', function (req, res) {
  var option = {
    root: path.join(__dirname)
  }
  var filename = 'index.html';
  res.sendFile(filename, option);
});
app.get('/play', function (req, res) {
  var option = {
    root: path.join(__dirname)
  }
  var filename = 'play.html';
  res.sendFile(filename, option);
});
var roomno = 1;
var full = 0;

io.on('connection', async (socket) => {
  // console.log('a user connected');
  const name = socket.handshake.query.name;
  socket.on('createRoom', async ({ nickname, gameID }) => {
    nickname = nickname.toString();
    gameID = parseInt(gameID);
    const hasPlayer = await Room.findOne({ gameID: gameID });
    if (hasPlayer) {
      socket.emit('playexist', { gameID: gameID });
      // console.log('plaYER EXIST');
      return;
    } else {
      // console.log('New User');
    }
    try {
      let room = new Room();
      let player = {
        socketID: socket.id,
        nickname,
        playerType: 'X',
      };
      room.socketId = socket.id;
      room.players.push(player);
      room.turn = player;
      room.gameID = gameID;
      socket.join(gameID.toString());
      room = await room.save();
      // console.log(room);
      const roomID = room._id.toString();
      socket.join(gameID.toString());
      // console.log(roomID, gameID);
      io.to(gameID.toString()).emit('createdRoom', {'roomObj':room,socketUID:socket.id});
      // console.log('S  id  ',socket.id);
      io.to(gameID.toString()).emit('created', { gameID: gameID.toString(),socketUID:socket.id });//changevarum
    } catch (e) {
      console.log(e);
    }
    // console.log(nickname);
  })
  socket.on('joinRand', async ({ nickname }) => {
    // console.log(nickname);

  })
  socket.on('joinRandom', async ({ nickname }) => {
    // console.log('Room', nickname);
    full += 1;
    nickname = nickname.toString();
    var gameID = roomno;
    if (full % 2 == 0) {
      try {
        let room = await Room.findOne({ gameID: parseInt(gameID) });
        if (room) {
          // console.log('User found:');
        } else {
          // console.log('User not found.');
          return
        }
        gameID = gameID.toString();
        if (room.isJoin) {
          let player = {
            nickname,
            socketID: socket.id,
            playerType: 'O'
          }
          socket.join(gameID.toString());
          room.players.push(player);
          // console.log(room);
          room = await room.save();
          var gameObj;
          var xPlayer;
          var oPlayer;
          try {gameObj = await Room.findOne({ gameID: parseInt(gameID) });
          } catch (e) {
            // console.log(e);
          }
          if (gameObj) {
            const play = gameObj.players.find(player => player.playerType === 'X');
            xPlayer = play.nickname;
            const play1 = gameObj.players.find(player => player.playerType === 'O');
            oPlayer = play1.nickname;
          }
          const playerSym = 'O';
          const roominfo = room;
          io.to(gameID.toString()).emit('RoomJoin', { roominfo, playerSym,'socUID':socket.id });
          io.to(gameID.toString()).emit('PlayerJoined', { 'id': socket.id });
          io.to(gameID.toString()).emit('randomplayerJoined', { 'id': socket.id });
          io.to(gameID.toString()).emit('joinFound', { ticID: gameID.toString(), xPlayer, oPlayer });
          socket.emit('joinTic', { ticID: gameID.toString(),socketUID:socket.id  });//changevarum
          // console.log('gameID', gameID);
        }
        // console.log('Joined');
      } catch (e) {
        console.log(e);
      }
      roomno += 1;
    }
    else {
      try {
        let room = new Room();
        let player = {
          socketID: socket.id,
          nickname,
          playerType: 'X',
        };
        room.socketId = socket.id;
        room.players.push(player);
        room.turn = player;
        room.gameID = gameID;
        socket.join(gameID.toString());
        room = await room.save();
        // console.log(room);
        const roomID = room._id.toString();
        socket.join(gameID.toString());
        // console.log(roomID, gameID);
        io.to(gameID.toString()).emit('createdRoom', {'roomObj':room,socketUID:socket.id});
        io.to(gameID.toString()).emit('created', { gameID: gameID.toString(),socketUID:socket.id  });//changevarum
      } catch (e) {
        console.log(e);
      }
    }
    // console.log(nickname);
  });

  socket.on('joinRoom', async ({ nickname, roomid }) => {
    try {
      let room = await Room.findOne({ gameID: parseInt(roomid) });

      if (room) {
        // console.log('User found:', room);
        // socket.emit('joinFound',{isplayer:true});
      } else {
        // console.log('User not found.');
        socket.emit('joinNotFound', { isplayer: true });
        socket.leave(roomid.toString());
        return
      }
      socket.join(roomid.toString());
      if (room.isJoin) {
        let player = {
          nickname,
          socketID: socket.id,
          playerType: 'O'
        }
        room.players.push(player);
        room = await room.save();

        var gameObj;
        var xPlayer;
        var oPlayer;
        try {
          // gameObj=await Room.findOne({ 'players.socketID': socket.id });
          gameObj = await Room.findOne({ gameID: parseInt(roomid) });

        } catch (e) {
          console.log(e);
        }
        if (gameObj) {
          const play = gameObj.players.find(player => player.playerType === 'X');
          xPlayer = play.nickname;
          const play1 = gameObj.players.find(player => player.playerType === 'O');
          oPlayer = play1.nickname;
        }

        // io.to(roomid.toString()).emit('RoomJoin',room);
        const roominfo = room;
        io.to(roomid.toString()).emit('RoomJoin', { 'roominfo': room, 'playerSym': 'O','socketUID':socket.id});
        io.to(roomid.toString()).emit('PlayerJoined', { 'id': socket.id });
        io.to(roomid.toString()).emit('joinFound', { ticID: roomid.toString(), xPlayer, oPlayer });
        socket.emit('joinTic', { ticID: roomid.toString(),socketUID:socket.id });//changevarum
        // console.log("Roomid", roomid.toString());
      }

    } catch (e) {
      console.log(e);
    }

  });

  socket.on('winPlayer', ({ win1, win2, ticID }) => {
    io.to(ticID.toString()).emit('winPlaying', { win1, win2 });

  });
  socket.on('ticExit', async ({ Ticid }) => {
    const deletedUser = await Room.findOneAndDelete({ gameID: parseInt(Ticid) });
    if (deletedUser) {
      roomno -= 1;

      // // console.log('Tic Exit:', deletedUser);
    } else {
      // console.log('User not found.');
    }
    io.to(Ticid.toString()).emit('exitBoth', { Ticid });
    // socket.leave();
    // socket.disconnect();
  });


  socket.on('sendmessage', function (data) {
    const { sendmessage, roomid } = data;
    console.log(sendmessage);
    // console.log(roomid, sendmessage);
    io.to(roomid.toString()).emit('receiveMessage',{'receiveMessage':sendmessage,'socketUID':socket.id});
  });

  socket.on('clickIndex', async (data) => {
    const { clickIndex, roomid } = data;
    // console.log('Click  ', clickIndex, roomid);
    var gameObj;
    try {
      gameObj = await Room.findOne({ 'players.socketID': socket.id });
    } catch (e) {
      // console.log(e);
    }
    if (gameObj) {
      const play = gameObj.players.find(player => player.socketID === socket.id);
      const player = play.playerType;
      // console.log(player);
      io.to(roomid.toString()).emit('opponentClick', { clickIndex, player });
    }
  });

  socket.on('removedb', async () => {
    // console.log('Remove');
    //   Room.deleteMany({occupancy:2}).then(function(){
    //     console.log("Data deleted"); // Success
    // }).catch(function(error){
    //     console.log(error); // Failure
    // });
    try {
      // Delete data from MongoDB when the user disconnects
      // const player=await Room.findOne({'players.playerType':'X','players.socketID':socket.id});
      // console.log('create',player);,'players.playerType':'X'
      const deletedUser = await Room.findOneAndDelete({ socketId: socket.id });
      if (deletedUser) {
        roomno -= 1;
        // console.log('Deleted User:', deletedUser);
      } else {
        // console.log('User not found.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  })

  socket.on('disconnect', async () => {
    // console.log('User disconnected.');

    try {
      const hasUser = await Room.findOne({ 'players.socketID': socket.id });
      // console.log("Has User");
      if (hasUser) {
        const playID = hasUser.gameID;

        roomno -= 1;
        io.to(playID.toString()).emit('exitBoth', { Ticid: playID });
        // socket.leave(playID.toString());
        // console.log('Tic Exit:', deletedUser);
      } else {
        // console.log('User not found.');
      }


      // Delete data from MongoDB when the user disconnects
      // const player=await Room.findOne({'players.playerType':'X','players.socketID':socket.id});
      // console.log('create',player);,'players.playerType':'X'
      //old  socketId: socket.id
      const deletedUser = await Room.findOneAndDelete({ 'players.socketID': socket.id });
      if (deletedUser) {
        roomno -= 1;
        // console.log('Deleted User:', deletedUser);
      } else {
        // console.log('User not found.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
});

app.use(express.json());
const DB = 'mongodb+srv://logsak25:abishekdeepak@abishekdb.55wn9ig.mongodb.net/?retryWrites=true&w=majority'

mongoose.connect(DB).then(() => {
  // console.log("connect success");
}).catch((e) => {
  // console.log("Failed");
});

server.listen(port, '0.0.0.0', () => {
  // console.log('listening on', port);
});

// mongodb+srv://logsak25:<password>@abishekdb.55wn9ig.mongodb.net/?retryWrites=true&w=majority

