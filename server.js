//socket.on is definition of the function 'example'
//while socket.emit is kind of calling the socket.on function
const express= require("express");
const http= require("http")
const app = express();
const mongoose= require("mongoose");
const formatMessage= require("./utils/messages");
const {userJoin, getCurrentUser, userLeave, getRoomUsers}= require("./utils/users");
const socketio = require("socket.io");
const bot= 'Health-E Bot';
app.use(express.static("public"));
const server = http.createServer(app);
 const io= socketio(server);

 mongoose.connect("mongodb://localhost:27017/chatDB", {useNewUrlParser: true});

const roomsSchema={
  room_name:String,
  chat_history:[]
}
const Room= new mongoose.model("Room", roomsSchema);

// we are using http to help express work with socket io

//run when client connects
//io will listen for a event/connection
io.on("connection", function(socket){
  socket.on('joinRoom', function({username, room}){
    const user= userJoin(socket.id, username, room);
    socket.join(user.room);
    //it is only sent to the guy joining
    Room.find({}, function(err, result){
      var x=-1;
      // console.log("I am looking for room:"+user.room);
      for(var i=0; i<result.length; i++){
        if(result[i].room_name == user.room){
          x=i;
        }
      }
      if(x == -1){
        const room1= new Room({
          room_name: user.room,
          chat_history: []
        });
        room1.save();
        // console.log("creating a new room");
        socket.emit("message", formatMessage(bot,"Welcome to chat app"));
      }else{
        for(var i=0; i<result[x].chat_history.length; i++){
          socket.emit("message", result[x].chat_history[i]);
        }
        socket.emit("message", formatMessage(bot,"Welcome to chat app"));
      }
    });


    //broadcast when a user connections
    //it is sent to all except the guy joining
    socket.broadcast.to(user.room).emit("message",formatMessage(bot, `${username} has joined the chat`));


    //Send users and room info from
    //server to clients
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  //jesse hi client side se kuch bhi chat waale form se content
  //server pe aata hai toh hum usse baaki members ko bhi dikhana
  //chahenge, so ab hum server se firse client ko content bhej denge
  //listen for chatMessage
  socket.on("chatMessage", function(msg){
    const user= getCurrentUser(socket.id);
    const msg1= formatMessage(user.username,msg);

    io.to(user.room).emit("message", msg1);
    Room.find({}, function(err, res){
      for(var i=0; i<res.length; i++){
        if(res[i].room_name == user.room){
          res[i].chat_history.push(msg1);
          res[i].save();
        }
      }
    })
  });


  //runs when a client disconnects
  //it is sent to all
  socket.on("disconnect", function(){
    const user= userLeave(socket.id);
    // console.log(user);
    io.to(user.room).emit("message", formatMessage(bot, `${user.username} has left the chat`));
    //Send users and room info from
    //server to clients
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });
});






const port= 3000 || process.env.PORT;

server.listen(port, function(req, res){
  console.log("Server is running successfully");
})
