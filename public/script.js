// Connect to the Socket.IO server
const socket = io();

const messagesDiv = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');

const usernameOverlay = document.getElementById('username-overlay');
const usernameInput = document.getElementById('usernameInput');
const enterChatBtn = document.getElementById('enterChatBtn');
const mainContainer = document.querySelector('.main-container');
const userList = document.getElementById('userList');

let username = null;
let recipientId = null;

// Store the client's socket ID
let clientId = null;
socket.on('connect', () => {
  clientId = socket.id;
});

// Prompt for username
enterChatBtn.addEventListener('click', () => {
  const enteredUsername = usernameInput.value.trim();
  if (enteredUsername) {
    username = enteredUsername;
    socket.emit('setUsername', username);
    usernameOverlay.style.display = 'none';
    mainContainer.style.display = 'flex';
  }
});

// Update user list
socket.on('usersList', (users) => {
  userList.innerHTML = '';
  users.forEach((user) => {
    if (user.id !== clientId) {
      const li = document.createElement('li');
      li.textContent = user.username;
      li.dataset.id = user.id;
      userList.appendChild(li);
    }
  });
});

// Select recipient for DM
userList.addEventListener('click', (e) => {
  if (e.target && e.target.nodeName === 'LI') {
    const selectedId = e.target.dataset.id;
    if (recipientId === selectedId) {
      // Unselect if already selected
      recipientId = null;
      e.target.classList.remove('selected');
    } else {
      recipientId = selectedId;
      // Highlight selected user
      const lis = userList.querySelectorAll('li');
      lis.forEach(li => li.classList.remove('selected'));
      e.target.classList.add('selected');
    }
  }
});

// When we receive a chatMessage from the server
socket.on('chatMessage', (data) => {
  // Show the message if it's public or if the client is the sender/recipient
  if (!data.recipientId || data.recipientId === clientId || data.id === clientId) {
    const p = document.createElement('p');
    // Indicate DM messages
    if (data.recipientId) {
      p.classList.add('dm-message');
      p.textContent = `(DM from ${data.username}) ${data.text}`;
    } else {
      p.textContent = data.text;
    }

    // Apply different styles based on the sender
    if (data.id === clientId) {
      p.classList.add('my-message');
    } else {
      p.classList.add('other-message');
    }

    messagesDiv.appendChild(p);

    // Scroll to the latest message
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
});

// When user clicks the send button, send message to the server
sendBtn.addEventListener('click', () => {
  const msg = msgInput.value.trim();
  if (msg) {
    const messageData = {
      text: msg,
      recipientId: recipientId // Null for public messages
    };
    socket.emit('chatMessage', messageData);
    msgInput.value = '';
  }
});

// Send message on pressing 'Enter' in the input field
msgInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    sendBtn.click();
  }
});

fileInput.addEventListener('change', () => {
  const files = fileInput.files;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();

    reader.onload = function(event) {
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: event.target.result,
        id: clientId,
        recipientId: recipientId // Include recipientId
      };
      socket.emit('fileMessage', fileData);
    };

    reader.readAsArrayBuffer(file);
  }
});

// Receive file messages from the server
socket.on('fileMessage', (fileData) => {
  // Show the file if it's public or if the client is the sender/recipient
  if (!fileData.recipientId || fileData.recipientId === clientId || fileData.id === clientId) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([fileData.data]));
    link.download = fileData.name;
    link.textContent = `Download ${fileData.name}`;

    const p = document.createElement('p');
    // Indicate DM files
    if (fileData.recipientId) {
      p.classList.add('dm-message');
      p.textContent = `(DM from ${fileData.username}) `;
    }

    if (fileData.id === clientId) {
      p.classList.add('my-message');
    } else {
      p.classList.add('other-message');
    }
    p.appendChild(link);
    messagesDiv.appendChild(p);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
});
