//way to access the chat.html form and getting the dom element
const chatForm= document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName= document.getElementById("room-name");
const userList= document.getElementById("users");

//ig main.js is the intermediate between server and client

//get username and room id from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});
const socket= io();

//Join chatroom
//this is going to server
socket.emit('joinRoom', {username, room});


//Get room and Users
socket.on('roomUsers', function({room, users}){
  outputRoomName(room);
  outputUsers(users);
});



//message from server
socket.on("message", function(message){
  //server ko joh msg clients ko display karvana hain
  //woh yaha se jayega
  outputMessage(message);
  //after printing the message we want to scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

//message submit
// we wil listen for a submit
chatForm.addEventListener("submit", function(e){
  e.preventDefault();
  //get message text
  const msg= e.target.elements.msg.value;


  //emitting the message we got from client to server

  //client ke form se mein apne server pe bhejungs
  socket.emit("chatMessage", msg);

  //clearing the vlient form once we submit message to server
  e.target.elements.msg.value="";
  e.target.elements.msg.focus();
})


//output message to DOM
//display messge in chat
function outputMessage(msg){
  const div = document.createElement('div');
  //adding a particular div class from chat html
  //to print msg according to styles
  div.classList.add('message');
  div.innerHTML= `<p class="meta">${msg.username} <span>${msg.time}</span></p><p class="text"> ${msg.text} </p>`;
  document.querySelector('.chat-messages').appendChild(div);
}

//Add room name to DOM
function outputRoomName(room){
  roomName.innerText= room;
}
//Add users to DOM
function outputUsers(users){
  userList.innerHTML= `${users.map(user=> `<li>${user.username}</li>`).join('')}`;
}
