// Connect to the Socket.IO server
const socket = io();

const messagesDiv = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');

// Store the client's socket ID
let clientId = null;
socket.on('connect', () => {
  clientId = socket.id;
});

// When we receive a chatMessage from the server
socket.on('chatMessage', (data) => {
  const p = document.createElement('p');
  p.textContent = data.text;

  // Apply different styles based on the sender
  if (data.id === clientId) {
    p.classList.add('my-message');
  } else {
    p.classList.add('other-message');
  }

  messagesDiv.appendChild(p);

  // Scroll to the latest message
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// When user clicks the send button, send message to the server
sendBtn.addEventListener('click', () => {
  const msg = msgInput.value.trim();
  if (msg) {
    socket.emit('chatMessage', msg);
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
        id: clientId
      };
      socket.emit('fileMessage', fileData);
    };

    reader.readAsArrayBuffer(file);
  }
});

// Receive file messages from the server
socket.on('fileMessage', (fileData) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([fileData.data]));
  link.download = fileData.name;
  link.textContent = `Download ${fileData.name}`;

  const p = document.createElement('p');
  if (fileData.id === clientId) {
    p.classList.add('my-message');
  } else {
    p.classList.add('other-message');
  }
  p.appendChild(link);
  messagesDiv.appendChild(p);

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
