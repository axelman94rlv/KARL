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

const clients = {}; // { socketId: { username, token, profileImage } }
const tokens = {}; // { token: { socketId, username, profileImage, expiresAt } }

// Configuration
const TOKEN_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // 7 jours
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Nettoyage chaque heure

app.get("/", (req, res) => {
  res.send("✅ Serveur Socket.IO en cours d'exécution");
});

// Fonction pour nettoyer les tokens expirés
const cleanupExpiredTokens = () => {
  const now = Date.now();
  let count = 0;

  for (const token in tokens) {
    if (tokens[token].expiresAt < now) {
      console.log(`🗑️ Token expiré supprimé: ${token}`);
      delete tokens[token];
      count++;
    }
  }

  if (count > 0) {
    console.log(`🧹 ${count} token(s) nettoyé(s)`);
  }
};

// Lance le nettoyage automatique
setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL);

io.on("connection", (socket) => {
  const clientToken = socket.handshake.auth.token;

  console.log(`✅ Client connecté: ${socket.id}`);

  // Vérifie si c'est une reconnexion
  if (clientToken && tokens[clientToken]) {
    const tokenData = tokens[clientToken];
    const now = Date.now();

    if (tokenData.expiresAt > now) {
      // Token valide
      const oldSocketId = tokenData.socketId;
      const username = tokenData.username;
      const profileImage = tokenData.profileImage; // Récupère la photo

      console.log(`🔄 Reconnexion détectée: ${oldSocketId} -> ${socket.id}`);

      delete clients[oldSocketId];
      clients[socket.id] = { username, token: clientToken, profileImage };
      tokens[clientToken].socketId = socket.id;

      socket.emit("reconnected", {
        success: true,
        message: "Reconnexion réussie!",
        username: username,
        profileImage: profileImage, // Envoie la photo
        token: clientToken,
      });
    } else {
      // Token expiré
      console.log(`⏰ Token expiré: ${clientToken}`);
      delete tokens[clientToken];
      clients[socket.id] = { username: null, token: null, profileImage: null };

      socket.emit("token-expired", {
        success: false,
        message: "Votre session a expiré. Veuillez entrer un nouveau pseudo.",
      });
    }
  } else {
    // Nouveau client
    clients[socket.id] = { username: null, token: null, profileImage: null };
  }

  // Écoute la sauvegarde du pseudo
  socket.on("set-username", (data) => {
    const { username } = data;
    const now = Date.now();

    // Vérifie si un token existe déjà
    let token = clients[socket.id]?.token;

    if (!token) {
      // Génère un nouveau token SEULEMENT s'il n'en existe pas
      token = `token_${socket.id}_${now}`;
      console.log(`🔑 Nouveau token généré: ${token}`);

      tokens[token] = {
        socketId: socket.id,
        username,
        profileImage: null, // Initialise avec null
        expiresAt: now + TOKEN_EXPIRATION_TIME,
      };
      console.log(
        `📝 Token sauvegardé avec expiration: ${TOKEN_EXPIRATION_TIME / 1000 / 60 / 60 / 24} jours`,
      );
    } else {
      console.log(`♻️ Token réutilisé: ${token}`);
      tokens[token].username = username;
    }

    // Sauvegarde/met à jour le pseudo
    clients[socket.id] = {
      username,
      token,
      profileImage: clients[socket.id]?.profileImage || null, // Garde la photo existante
    };

    console.log(`📝 Pseudo sauvegardé: ${socket.id} -> ${username}`);

    socket.emit("username-saved", {
      success: true,
      message: `Pseudo "${username}" sauvegardé!`,
      username: username,
      token: token,
    });

    io.emit("clients-updated", clients);
  });

  // Écoute l'upload de photo de profil
  socket.on("upload-profile-image", (data) => {
    const { profileImage, fileName } = data;

    const token = clients[socket.id]?.token;

    if (token) {
      clients[socket.id].profileImage = profileImage;
      tokens[token].profileImage = profileImage;

      console.log(`📸 Photo de profil sauvegardée: ${fileName}`);

      socket.emit("profile-image-saved", {
        success: true,
        message: "Photo de profil sauvegardée!",
        profileImage: profileImage,
      });

      io.emit("clients-updated", clients);
    } else {
      socket.emit("profile-image-saved", {
        success: false,
        message: "Erreur: pas de token trouvé",
      });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`⚠️ Client déconnecté: ${socket.id} (${reason})`);
  });

  socket.on("connect_error", (error) => {
    console.log("❌ Erreur de connexion:", error);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur écoute sur http://localhost:${PORT}`);
  console.log(
    `⏰ Les tokens expirent après ${TOKEN_EXPIRATION_TIME / 1000 / 60 / 60 / 24} jours`,
  );
  console.log(
    `🧹 Nettoyage automatique chaque ${CLEANUP_INTERVAL / 1000 / 60} minutes`,
  );
});
