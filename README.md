```
# LC-NET - Local Chat on Network for Exchanges and Talks

**LC-NET** is a simple, lightweight, and real-time chat platform designed to enable seamless communication on a **local network**. Whether you are in a classroom, workspace, or connected via a mobile hotspot, **LC-NET** allows multiple users on the same network to chat, exchange messages, and collaborate instantly.

---

## 🚀 Key Features

- **Real-Time Messaging:** Instantly broadcast messages to all connected users.  
- **Local Network Access:** Works entirely on LAN or mobile hotspots. No internet connection required.  
- **Open and Easy:** No authentication needed—just connect and start chatting.  
- **Lightweight:** Minimal resource usage with fast performance.  
- **Customizable:** Extend the functionality with file sharing, persistent storage, or user identification.  

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js  
- **Real-Time Communication:** Socket.IO  
- **Frontend:** HTML, CSS, and JavaScript  

---

## 📋 Prerequisites

- **Node.js & npm:** Ensure you have [Node.js](https://nodejs.org/) installed on your system.  
- **Local Network:** Devices must be connected to the same LAN or mobile hotspot.  
- A server machine (your PC/laptop) to host the backend.

---

## ⚙️ Installation and Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourusername/LC-NET.git
   cd LC-NET
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Server:**
   ```bash
   npm start
   ```
   The server will run on `http://localhost:3000`.

4. **Find Your Local IP Address:**
   - **On Windows:** Run `ipconfig` in Command Prompt.  
   - **On macOS/Linux:** Run `ifconfig` or `ip addr show` in the terminal.  
   - Look for your IPv4 address (e.g., `192.168.x.x`).

5. **Access from Other Devices:**
   - Connect all devices to the same network.  
   - Open a browser on any device and navigate to:
     ```
     http://<your-local-IP>:3000
     ```
     Replace `<your-local-IP>` with the server’s IP address.

---

## 💻 Usage

1. Open the chat interface in your browser using the provided IP and port.  
2. Type a message in the input box and press "Send."  
3. Messages will appear instantly for all connected users.  
4. Collaborate, chat, and exchange information seamlessly over the local network.

---

## 🛠️ Customization

- **Change Port:** Modify the port number in `server.js`:
   ```javascript
   const PORT = 3000; // Replace 3000 with your desired port
   ```
- **UI and Styling:** Update `public/index.html` and `public/style.css` to customise the chat interface.  
- **Add Features:** Extend functionality (e.g., file uploads, chat history) using libraries like `multer` for file handling or databases like SQLite.

---

## 🐞 Troubleshooting

- **Cannot Connect from Other Devices:**  
   - Ensure all devices are connected to the same network.  
   - Use the correct local IP address (not `localhost`).  
   - Check for firewall restrictions on the server machine and allow traffic on port `3000`.

- **Slow Performance:**  
   - Ensure a stable network connection.  
   - Limit the number of connected users if required.

---

## 🤝 Contributing

We welcome contributions to improve **LC-NET**!  
1. Fork the repository.  
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes and push:
   ```bash
   git commit -m "Add feature: your-feature-name"
   git push origin feature/your-feature-name
   ```
4. Submit a Pull Request describing your changes.

---

## 📝 License

This project is licensed under the [MIT License](./LICENSE).  

---

### 🎉 Built with simplicity and speed for local communication.  
**LC-NET: Local Chat on Network for Exchanges and Talks**  
```
