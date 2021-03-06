const mongoose = require('mongoose');
const ChatMessage = mongoose.model('ChatMessage');
const ChatChannel = mongoose.model('ChatChannel');

const mubsub = require('mubsub');
const mubsubClient = mubsub(`mongodb://${process.env.RUNS_IN_DOCKER ? 'mongo' : 'localhost'}/konfetti-mubsub`);

function init(server) {
  const io = require('socket.io')(server);
  const socketioJwt = require('socketio-jwt');

  const clients = {};

  io.on('connection', socketioJwt.authorize({
    secret: process.env.JWT_SECRET || 'shhhhh',
    timeout: 15000 // 15 seconds to send the authentication message
  })).on('authenticated', function(socket) {

    clients[socket.id] = socket;
    

    //socket is authenticated, we are good to handle more events from it.
    console.log(`new socket connection: ${socket.decoded_token.username} ${socket.id}`);
    socket.emit('connection established');

    socket.on('room selection', function(data){
		
        socket.join(data.roomID);
        console.log(`socket: ${socket.decoded_token.username} ${socket.id} joined room: ${ data.roomID}`);

        const mubsubChannel = mubsubClient.channel(data.roomID);
        
        mubsubClient.on('error', console.error);
        mubsubChannel.on('error', console.error);

        let subscription = mubsubChannel.subscribe('chat message', (msg) => {
          // console.log('notified about new message ' + msg);
          ChatMessage.getChatMessage(msg, (err, chatMessage) => {
            socket.emit('chat message', chatMessage);
          });
          // console.log(`chatMessage Object: ${JSON.stringify()}`);
          console.log(`socket emitting to user: ${socket.decoded_token.username} socket: ${socket.id} room: ${ data.roomID}`);
          ;
        });

        socket.on('chat message', function(msg){
          console.log(`new message from io: ${socket.decoded_token.username} ${socket.id} ${msg}`);
            ChatMessage.createChatMessage(msg, data.roomID, socket.decoded_token.userId);
          // mubsubChannel.publish('chat message', msg);
        });
    
        socket.on('disconnect', function() {
          console.log(`client disconnected: ${socket.decoded_token.username} ${socket.id}`);
          delete clients[socket.id];
          socket.disconnect(true); // shutdown TCP connection
          subscription.unsubscribe();
        });
  });
    
    
    

    
  });
}

exports.init = init;
