const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

app.get("/", (req, res) => {
  res.send("✅ Serveur Socket.IO en cours d'exécution");
});

io.on("connection", (socket) => {
  console.log(`✅ Client connecté: ${socket.id}`);

  socket.on("test", (data) => {
    console.log("📨 Message reçu du client:", data);
    socket.emit("test-response", { message: "Réponse du serveur!" });
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client déconnecté: ${socket.id}`);
  });

  socket.on("connect_error", (error) => {
    console.log("❌ Erreur de connexion:", error);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur écoute sur http://localhost:${PORT}`);
  console.log(
    `📱 Les clients doivent se connecter à http://192.168.X.X:${PORT}`,
  );
});
