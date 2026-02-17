# 🔌 Les Bases de Socket.IO - Concepts Essentiels

## 📚 Table des matières

1. [Qu'est-ce que Socket.IO ?](#quest-ce-que-socketio)
2. [HTTP vs WebSocket](#http-vs-websocket)
3. [Architecture Client-Serveur](#architecture-client-serveur)
4. [Concepts clés](#concepts-clés)
5. [Les événements](#les-événements)
6. [Authentification](#authentification)
7. [Reconnexion automatique](#reconnexion-automatique)
8. [Patterns courants](#patterns-courants)
9. [Erreurs communes](#erreurs-communes)
10. [Cas d'usage du projet KARL](#cas-dusage-du-projet-karl)

---

# Qu'est-ce que Socket.IO ?

## Définition simple

**Socket.IO** est une librairie JavaScript qui permet la **communication bidirectionnelle en temps réel** entre un client (navigateur/mobile) et un serveur.

```
Communication traditionnelle HTTP:
Client → demande → Serveur (puis attend)
Client ← réponse ← Serveur

Communication Socket.IO (bidirectionnelle):
Client ↔ connexion persistent ↔ Serveur
Les deux peuvent s'envoyer des messages n'importe quand
```

## Caractéristiques principales

| Propriété          | Détail                                                     |
| ------------------ | ---------------------------------------------------------- |
| **Bidirectionnel** | Client ET serveur peuvent initialer une connexion          |
| **Temps réel**     | Les messages arrivent instantanément (pas de refresh)      |
| **Fallbacks**      | Si WebSocket ne marche pas, utilise polling HTTP           |
| **Événements**     | Communication par événements nommés (comme `set-username`) |
| **Reconnexion**    | Reconnecter automatiquement en cas de déconnexion          |

---

# HTTP vs WebSocket

## HTTP (connexion classique)

```
Client: "Bonjour serveur, tu es là ?"
Serveur: "Oui, voici la réponse à ta question"
Client: "Merci, j'ai fini"
Connexion fermée ❌
```

**Problème** : Si le serveur veut envoyer un message, il doit attendre que le client demande quelque chose.

```javascript
// Exemple HTTP classique
fetch("https://api.com/data")
  .then((response) => response.json())
  .then((data) => console.log(data));
// Le client DOIT demander à chaque fois
```

## WebSocket (Socket.IO)

```
Client ↔ Connexion ouverte ↔ Serveur
Client peut envoyer messages quand il veut ✅
Serveur peut envoyer messages quand il veut ✅
```

**Avantage** : La connexion reste ouverte, communication instantanée.

```javascript
// Exemple Socket.IO
socket.on("connect", () => {
  console.log("Connecté au serveur!");
});

socket.emit("mon-evenement", { data: "..." });

socket.on("reponse-serveur", (data) => {
  console.log("Le serveur a répondu:", data);
});
// La connexion reste ouverte et échange les messages
```

---

# Architecture Client-Serveur

## Vue d'ensemble

```
┌─────────────────────────────────────────────┐
│           NAVIGATEUR / APP MOBILE           │
├─────────────────────────────────────────────┤
│                                             │
│  React Component                            │
│       ↓                                     │
│  useSocket Hook                             │
│       ↓                                     │
│  Socket.IO Client (socket.io-client)        │
│       ↓ WebSocket                           │
└─────────────────────────────────────────────┘
                    ↓ connexion WebSocket
┌─────────────────────────────────────────────┐
│           SERVEUR NODE.JS / EXPRESS         │
├─────────────────────────────────────────────┤
│                                             │
│  Socket.IO Server (socket.io)               │
│       ↓                                     │
│  io.on("connection", (socket) => {...})     │
│       ↓                                     │
│  Base de données / Fichiers                 │
│                                             │
└─────────────────────────────────────────────┘
```

## Communication détaillée

```
1️⃣  Client init Socket.IO
    socket = io("http://localhost:3000")

2️⃣  Établir connexion WebSocket
    Envoyer handshake (poignée de main) au serveur

3️⃣  Serveur reçoit connexion
    io.on("connection", (socket) => { ... })

4️⃣  Client envoie un événement
    socket.emit("mon-event", { data: "..." })

5️⃣  Serveur écoute cet événement
    socket.on("mon-event", (data) => {
      console.log("Reçu:", data);
    })

6️⃣  Serveur répond (optionnel)
    socket.emit("reponse", { ... })

7️⃣  Client reçoit la réponse
    socket.on("reponse", (data) => {
      console.log("Réponse serveur:", data);
    })

8️⃣  Client se déconnecte
    socket.disconnect()

9️⃣  Serveur reçoit la déconnexion
    socket.on("disconnect", () => { ... })
```

---

# Concepts clés

## 1️⃣ Socket (connexion)

Un **socket** est une connexion unique entre le client et le serveur.

```javascript
// CÔTÉ CLIENT
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");
// socket = une connexion unique à ce serveur

console.log(socket.id); // Ex: "abc123xyz" (unique)
```

```javascript
// CÔTÉ SERVEUR
io.on("connection", (socket) => {
  // socket = l'objet du client qui vient de se connecter
  console.log(socket.id); // Ex: "abc123xyz" (même que le client)
});
```

**Chaque socket a un identifiant unique** (`socket.id`) généré automatiquement.

## 2️⃣ Événements (Events)

Un **événement** est un message nommé qu'on envoie avec des données.

```javascript
// Émettre un événement
socket.emit("mon-event-name", { username: "Alice", age: 25 });
```

**Structure d'un événement** :

- **Nom** : `"set-username"`, `"upload-photo"`, etc.
- **Données** : un objet JavaScript quelconque
- **Direction** : client → serveur ou serveur → client

**Événements réservés** (générés automatiquement) :

- `"connect"` : quand la connexion est établie
- `"disconnect"` : quand la connexion se ferme
- `"error"` : quand une erreur survient

## 3️⃣ Emit vs On

### `socket.emit()` - ENVOYER

```javascript
// Envoyer un événement AU SERVEUR
socket.emit("set-username", { username: "Alice" });

// Ou envoyer AU CLIENT (du serveur)
socket.emit("username-saved", { success: true });
```

### `socket.on()` - ÉCOUTER

```javascript
// Écouter un événement DU SERVEUR
socket.on("username-saved", (data) => {
  console.log("Réponse reçue:", data);
});

// Ou écouter un événement DU CLIENT (du serveur)
socket.on("set-username", (data) => {
  console.log("Client a envoyé:", data);
});
```

## 4️⃣ Broadcast vs Emission directe

### Envoyer à UN CLIENT

```javascript
// SERVEUR : envoyer à un client spécifique
socket.emit("message", "Ceci est pour toi seul");
```

### Envoyer à TOUS les clients

```javascript
// SERVEUR : envoyer à TOUS les clients connectés
io.emit("message", "Ceci est pour tout le monde");
```

**Exemple réaliste** :

```javascript
// Alice se connecte
socket.on("set-username", (data) => {
  // Confirmer à Alice seule
  socket.emit("username-saved", { success: true }); // ← Alice seule

  // Notifier tous les clients qu'Alice s'est connectée
  io.emit("new-user-connected", { username: data.username }); // ← Tout le monde
});
```

## 5️⃣ Handshake (poignée de main)

Le **handshake** est la phase initiale où le client et le serveur se "saluent".

```javascript
// CÔTÉ CLIENT
const socket = io("http://localhost:3000", {
  auth: {
    token: "mon-token-secret", // Envoyer des données d'authentification
  },
  reconnection: true, // Reconnecter auto
});
```

```javascript
// CÔTÉ SERVEUR
io.on("connection", (socket) => {
  // Accéder aux données envoyées dans auth
  const token = socket.handshake.auth.token;

  if (token === "mon-token-secret") {
    console.log("✅ Token valide, connexion acceptée");
  } else {
    console.log("❌ Token invalide");
    socket.disconnect(); // Rejeter la connexion
  }
});
```

---

# Les événements

## Événements réservés (côté client)

```javascript
// Connexion réussie
socket.on("connect", () => {
  console.log("✅ Connecté au serveur");
});

// Déconnexion (intentionnelle ou accidentelle)
socket.on("disconnect", (reason) => {
  console.log("❌ Déconnecté:", reason);
  // reason peut être: "io server namespace disconnect", "io client namespace disconnect", etc
});

// Erreur de connexion
socket.on("error", (error) => {
  console.log("⚠️ Erreur:", error);
});

// Reconnexion réussie
socket.on("reconnect", () => {
  console.log("🔄 Reconnecté!");
});

// Tentative de reconnexion
socket.on("reconnect_attempt", () => {
  console.log("🔄 Tentative de reconnexion...");
});
```

## Événements réservés (côté serveur)

```javascript
// Un client se connecte
io.on("connection", (socket) => {
  console.log("✅ Client connecté:", socket.id);

  // Écouter la déconnexion de CE client
  socket.on("disconnect", () => {
    console.log("❌ Client déconnecté:", socket.id);
  });

  // Écouter une erreur de CE client
  socket.on("error", (error) => {
    console.log("⚠️ Erreur du client:", error);
  });
});
```

## Événements personnalisés (comme dans KARL)

```javascript
// KARL utilise ces événements:

// ✅ set-username (client → serveur)
socket.emit("set-username", { username: "Alice" });

// ✅ username-saved (serveur → client)
socket.on("username-saved", (data) => { ... });

// ✅ upload-profile-image (client → serveur)
socket.emit("upload-profile-image", { imageBase64: "..." });

// ✅ profile-image-saved (serveur → client)
socket.on("profile-image-saved", (data) => { ... });

// ✅ reconnected (serveur → client)
socket.on("reconnected", (data) => { ... });

// ✅ token-expired (serveur → client)
socket.on("token-expired", () => { ... });
```

---

# Authentification

## Pourquoi l'authentification ?

Sans authentification, n'importe qui peut se connecter et se faire passer pour quelqu'un d'autre.

```
Socket.IO n'authentifie PAS automatiquement
Tu dois implémenter l'authentification toi-même
```

## Authentification par token (ce qu'on utilise)

### Côté serveur

```javascript
io.on("connection", (socket) => {
  // Récupérer le token envoyé par le client
  const token = socket.handshake.auth.token;

  // Valider le token
  if (!isTokenValid(token)) {
    console.log("❌ Token invalide");
    socket.disconnect(); // Rejeter la connexion
    return;
  }

  // ✅ Token valide, continuer
  console.log("✅ Utilisateur authentifié");

  // Récupérer les données associées au token
  const userData = getUserDataFromToken(token);
  socket.username = userData.username;
});
```

### Côté client

```javascript
// Étape 1: Récupérer le token depuis AsyncStorage
const token = await AsyncStorage.getItem("reconnect_token");

// Étape 2: L'envoyer au serveur lors de la connexion
const socket = io("http://localhost:3000", {
  auth: {
    token: token || "", // Vide si pas de token (première connexion)
  },
});
```

## Token expiration

Un token a une **durée de vie limitée** (dans KARL: 7 jours).

```javascript
// CÔTÉ SERVEUR
const TOKEN_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // 7 jours en ms

// Quand générer un token
const expiresAt = Date.now() + TOKEN_EXPIRATION_TIME;

tokens[tokenId] = {
  username: "Alice",
  expiresAt: expiresAt, // Ex: 1702439367890
};

// Valider le token
function isTokenValid(token) {
  if (!tokens[token]) return false; // Token n'existe pas

  const now = Date.now();
  const expiresAt = tokens[token].expiresAt;

  return expiresAt > now; // Valide si pas expiré
}
```

## Nettoyage des tokens expirés

```javascript
// CÔTÉ SERVEUR
setInterval(
  () => {
    const now = Date.now();
    let deleted = 0;

    for (const tokenId in tokens) {
      if (tokens[tokenId].expiresAt < now) {
        delete tokens[tokenId];
        deleted++;
      }
    }

    console.log(`🧹 ${deleted} tokens expirés supprimés`);
  },
  60 * 60 * 1000,
); // Toutes les heures
```

---

# Reconnexion automatique

## Pourquoi la reconnexion ?

Les connexions peuvent se perdre (perte WiFi, serveur redémarre, etc.)

Socket.IO essaie de **reconnecter automatiquement** au lieu de faire échouer l'application.

## Configuration côté client

```javascript
const socket = io("http://localhost:3000", {
  reconnection: true, // ✅ Reconnecter automatiquement
  reconnectionDelay: 1000, // Attendre 1000ms avant 1ère tentative
  reconnectionDelayMax: 5000, // Max 5000ms d'attente
  reconnectionAttempts: 10, // Essayer 10 fois max
});
```

## Exponential backoff

Attendre de plus en plus longtemps entre chaque tentative pour ne pas surcharger le serveur.

```
Tentative 1: attendre 1000ms (1 sec)
Tentative 2: attendre 2000ms (2 sec)
Tentative 3: attendre 3000ms (3 sec)
...
Tentative 5+: attendre 5000ms (5 sec) [max]
Tentative 11: abandon ❌
```

```javascript
// CÔTÉ CLIENT
socket.on("reconnect_attempt", () => {
  console.log("🔄 Tentative de reconnexion...");
});

socket.on("reconnect", () => {
  console.log("✅ Reconnecté!");
});

socket.on("reconnect_error", (error) => {
  console.log("⚠️ Erreur de reconnexion:", error);
});

socket.on("reconnect_failed", () => {
  console.log("❌ Reconnexion échouée après 10 tentatives");
});
```

## Restauration après reconnexion

Après reconnexion, il faut **restaurer les données** (username, photo, etc.).

```javascript
// CÔTÉ SERVEUR
io.on("connection", (socket) => {
  const token = socket.handshake.auth.token;

  if (token && isTokenValid(token)) {
    // ✅ Reconnexion: restaurer les données
    const userData = tokens[token];

    socket.emit("reconnected", {
      username: userData.username,
      profileImage: userData.profileImage,
    });
  } else {
    // Nouvelle connexion
    console.log("🆕 Nouvelle connexion");
  }
});
```

```javascript
// CÔTÉ CLIENT
socket.on("reconnected", (data) => {
  // Restaurer l'état React avec les anciennes données
  setSavedUsername(data.username);
  setProfileImage(data.profileImage);
  console.log("✅ Données restaurées après reconnexion");
});
```

---

# Patterns courants

## Pattern 1: Request-Response (demande-réponse)

```javascript
// CÔTÉ CLIENT
socket.emit("get-user-data", { userId: 123 }, (response) => {
  // Callback appelé quand le serveur répond
  console.log("Données reçues:", response);
});

// CÔTÉ SERVEUR
socket.on("get-user-data", (data, callback) => {
  const userData = {
    username: "Alice",
    age: 25,
  };

  // Appeler le callback avec les données
  callback(userData);
});
```

**Avantage** : Récupérer une réponse du serveur sans créer un nouvel événement.

## Pattern 2: Rooms (salons)

Un **room** est un groupe de clients qui écoutent les mêmes événements.

```javascript
// CÔTÉ SERVEUR
socket.on("join-room", (roomId) => {
  // Ajouter ce socket à une room
  socket.join(roomId);
  console.log(`Client joint la room: ${roomId}`);
});

socket.on("send-message", (message) => {
  // Envoyer à TOUS les clients de cette room
  io.to(roomId).emit("new-message", message);
});

socket.on("leave-room", (roomId) => {
  socket.leave(roomId);
});
```

**Cas d'usage** : Chat rooms, notifications ciblées, matchmaking pour jeux.

## Pattern 3: Middleware (validation)

Valider les données avant de les traiter.

```javascript
// CÔTÉ SERVEUR
io.use((socket, next) => {
  // Middleware: s'exécute avant TOUS les événements

  const token = socket.handshake.auth.token;

  if (!isTokenValid(token)) {
    // Rejeter la connexion
    next(new Error("Token invalide"));
  } else {
    // Accepter
    next();
  }
});

io.on("connection", (socket) => {
  // Si on arrive ici, le token est valide
  console.log("✅ Client authentifié");
});
```

## Pattern 4: Broadcast avec exclusion

Envoyer à TOUS les clients SAUF un.

```javascript
// CÔTÉ SERVEUR
socket.on("user-action", (data) => {
  // Envoyer à TOUS sauf au client qui a envoyé
  socket.broadcast.emit("user-action", data);
});
```

---

# Erreurs communes

## ❌ Erreur 1: Oublier le cleanup dans useEffect

```javascript
// ❌ MAUVAIS: Accumule les écouteurs
useEffect(() => {
  socket.on("message", (data) => {
    console.log(data);
  });
  // Pas de cleanup!
}, []);

// ✅ BON: Nettoie les écouteurs
useEffect(() => {
  const handleMessage = (data) => {
    console.log(data);
  };

  socket.on("message", handleMessage);

  return () => {
    socket.off("message", handleMessage);
  };
}, []);
```

**Pourquoi** ? Sans cleanup, chaque fois que le composant se remonte, on ajoute un nouvel écouteur = memory leak.

## ❌ Erreur 2: Utiliser `io.emit()` quand on voulait `socket.emit()`

```javascript
// ❌ MAUVAIS: io.emit envoie à TOUS
socket.on("private-message", (data) => {
  io.emit("response", { message: "Pour tout le monde" }); // ← Oups!
});

// ✅ BON: socket.emit envoie au client seul
socket.on("private-message", (data) => {
  socket.emit("response", { message: "Juste pour toi" }); // ← Correct
});
```

## ❌ Erreur 3: Oublier que les tokens s'expirent

```javascript
// ❌ MAUVAIS: Token sauvegardé mais jamais validé
const token = await AsyncStorage.getItem("token");
const socket = io(url, { auth: { token } }); // Pas de vérification!

// ✅ BON: Vérifier que le token est encore valide
socket.on("reconnected", (data) => {
  // Token valide, restaurer les données
  setSavedUsername(data.username);
});

socket.on("token-expired", () => {
  // Token expiré, demander une nouvelle connexion
  AsyncStorage.removeItem("token");
  setSavedUsername("");
});
```

## ❌ Erreur 4: Stocker des données côté serveur sans base de données

```javascript
// ❌ MAUVAIS: Les données sont perdues au redémarrage
const clients = {}; // En mémoire seulement

socket.on("set-username", (data) => {
  clients[socket.id] = data; // Perdu si serveur redémarre!
});

// ✅ BON: Sauvegarder dans une vraie base de données
socket.on("set-username", (data) => {
  // Sauvegarder dans MongoDB, PostgreSQL, etc.
  database.saveUser(socket.id, data);
});
```

## ❌ Erreur 5: Envoyer trop de données à la fois

```javascript
// ❌ MAUVAIS: Envoyer une énorme image non compressée
socket.emit("upload-photo", {
  photo: rawLargeImageData, // 100MB!
});

// ✅ BON: Compresser et envoyer du base64
socket.emit("upload-photo", {
  photo: "data:image/jpeg;base64,/9j/4AAQSkZJR...", // 50KB
});
```

---

# Cas d'usage du projet KARL

## Notre implémentation : Feature Username + Photo

### 1. Connexion initiale

```
Client veut se connecter
  ↓
Client: "Je veux me connecter"
  ↓
Serveur: "OK, établissons une connexion WebSocket"
  ↓
Connexion établie ✅
```

### 2. Sauvegarde du username

```
Utilisateur tape "Alice" + clic Valider
  ↓
socket.emit("set-username", { username: "Alice" })
  ↓
Serveur reçoit et valide
  ↓
Serveur génère token = "token_abc123xyz_..."
  ↓
Serveur: clients[socket.id] = { username, token }
  ↓
Serveur: tokens[token] = { username, expiresAt: ...}
  ↓
socket.emit("username-saved", { token })
  ↓
Client reçoit le token
  ↓
Client: saveReconnectToken(token) dans AsyncStorage
  ↓
Affichage: "Pseudo: Alice" ✅
```

### 3. Upload de photo

```
Utilisateur clique sur bouton + (photo)
  ↓
ImagePicker ouvre la galerie
  ↓
Utilisateur sélectionne une photo
  ↓
readAsStringAsync() convertit en base64
  ↓
socket.emit("upload-profile-image", { imageBase64 })
  ↓
Serveur reçoit et stocke dans le token
  ↓
tokens[token].profileImage = imageBase64
  ↓
socket.emit("profile-image-saved")
  ↓
Client affiche la photo ✅
```

### 4. Reconnexion (jours après)

```
Utilisateur ouvre l'app 2 jours après
  ↓
getReconnectToken() retrouve le token dans AsyncStorage
  ↓
socket = io(url, { auth: { token } })
  ↓
Client envoie le token au serveur
  ↓
Serveur cherche le token dans tokens{}
  ↓
Serveur valide: token expiré? Non ✅
  ↓
Serveur récupère: username et profileImage
  ↓
socket.emit("reconnected", { username, profileImage })
  ↓
Client reçoit et restaure
  ↓
Affichage: "Pseudo: Alice" + photo ✅
```

### 5. Token expiré

```
Utilisateur ouvre l'app 10 jours après
  ↓
Token = "token_..."
  ↓
Serveur le cherche dans tokens{}
  ↓
Pas trouvé (expiré et nettoyé par cleanupExpiredTokens)
  ↓
socket.emit("token-expired")
  ↓
Client reçoit et affiche: "Token expiré, reconnectez-vous"
  ↓
AsyncStorage.removeItem("token")
  ↓
Utilisateur doit retaper son username
```

---

# 🎓 Résumé des points clés

## Concepts fondamentaux

✅ Socket.IO = communication bidirectionnelle en temps réel
✅ WebSocket = connexion persistante (pas HTTP classique)
✅ socket.emit() = envoyer un événement
✅ socket.on() = écouter un événement
✅ socket.id = identifiant unique de la connexion

## Serveur vs Client

✅ `socket.emit()` = envoyer À UN CLIENT
✅ `io.emit()` = envoyer À TOUS les clients
✅ `socket.broadcast.emit()` = envoyer À TOUS sauf un

## Authentification

✅ Token = preuve d'identité (survit reconnexion)
✅ Expiration = sécurité (token périmé après 7j)
✅ Cleanup = économiser la mémoire

## Reconnexion

✅ Automatique = pas besoin de gérer manuellement
✅ Exponential backoff = attendre de plus en plus longtemps
✅ Restauration = renvoyer les anciennes données

## En production

⚠️ Ne pas utiliser la mémoire pour les données (utiliser une BDD)
⚠️ Implémenter une vraie authentification (JWT, OAuth)
⚠️ Ajouter HTTPS/WSS (sécurité)
⚠️ Limiter la taille des messages
⚠️ Ajouter des logs pour le debugging

---

## 🔗 Ressources utiles

- [Documentation officielle Socket.IO](https://socket.io/docs/)
- [Socket.IO Client Docs](https://socket.io/docs/v4/client-api/)
- [Socket.IO Server Docs](https://socket.io/docs/v4/server-api/)
- [Exemples Socket.IO](https://github.com/socketio/socket.io/tree/main/examples)

---

**Créé pour la feature KARL - Username & Photo Storage**
_Dernière mise à jour: 12 février 2026_
