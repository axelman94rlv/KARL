# 📚 Flux complet : Connexion, Reconnexion, Stockage Username et Photo

## 🎯 Vue d'ensemble globale

```
┌─────────────────────────────────────────────────────────────┐
│                    PREMIÈRE CONNEXION                        │
├─────────────────────────────────────────────────────────────┤
│ App démarre                                                 │
│  ↓                                                          │
│ socketService.ts : crée Socket.IO connection               │
│  ↓                                                          │
│ Cherche token dans AsyncStorage (mémoire téléphone)        │
│  ↓                                                          │
│ Si token trouvé → utilise token existant                   │
│ Si pas de token → nouvelle connexion sans auth             │
│  ↓                                                          │
│ Serveur reçoit connection                                  │
│  ↓                                                          │
│ Utilisateur saisit username + photo                        │
│  ↓                                                          │
│ Serveur génère token_abc123xyz_timestamp                   │
│  ↓                                                          │
│ Token sauvegardé dans AsyncStorage (survit aux redémarrages)
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  RECONNEXION (jours après)                   │
├─────────────────────────────────────────────────────────────┤
│ App redémarre                                               │
│  ↓                                                          │
│ AsyncStorage récupère ancien token                         │
│  ↓                                                          │
│ socketService.ts utilise ce token                          │
│  ↓                                                          │
│ Socket.IO envoie token dans handshake                      │
│  ↓                                                          │
│ Serveur valide le token (< 7 jours ?)                      │
│  ↓                                                          │
│ Si valide → retrouve username et photo du client           │
│ Si expiré → demande nouveau username                       │
│  ↓                                                          │
│ Envoie "reconnected" avec username + photo                 │
│  ↓                                                          │
│ useSocket.ts reçoit et restaure l'affichage                │
└─────────────────────────────────────────────────────────────┘
```

---

# 🔵 PARTIE 1 : INITIALISATION ET CONNEXION

## socketService.ts - Configuration initiale Socket.IO

**Fichier** : `/front/services/socketService.ts`
**Rôle** : Crée une instance Socket.IO unique, gère les tokens, établit la connexion

### **Imports**

```typescript
import { io } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
```

**Explication** :

- `io` : fonction pour créer un client Socket.IO
- `AsyncStorage` : système de stockage persistant du téléphone (comme localStorage web)
- Les tokens vont être sauvegardés dans AsyncStorage pour survivre aux redémarrages

### **Constantes**

```typescript
const SERVER_URL = "http://localhost:3000";
const RECONNECT_TOKEN_KEY = "reconnect_token";
```

**Explication** :

- `SERVER_URL` : adresse du serveur Socket.IO
- `RECONNECT_TOKEN_KEY` : clé pour retrouver le token dans AsyncStorage

### **Fonctions principales**

#### **1. `saveReconnectToken(token: string)`**

```typescript
const saveReconnectToken = async (token: string) => {
  // Sauvegarde le token dans AsyncStorage
  // Ce token permettra de se reconnecter plus tard
  await AsyncStorage.setItem(RECONNECT_TOKEN_KEY, token);
  console.log("💾 Token sauvegardé pour reconnexion");
};
```

**Quand ?** Appelé quand le serveur génère un token (première connexion)
**Pourquoi ?** Pour que le token persiste même si l'app se ferme

#### **2. `getReconnectToken()`**

```typescript
const getReconnectToken = async () => {
  // Récupère le token depuis AsyncStorage
  const token = await AsyncStorage.getItem(RECONNECT_TOKEN_KEY);
  return token || null;
};
```

**Quand ?** Appelé au démarrage de l'app
**Retour** : Le token ancien (s'il existe) ou null

#### **3. `clearReconnectToken()`**

```typescript
const clearReconnectToken = async () => {
  // Supprime le token
  // Utilisé quand le serveur dit "token expiré"
  await AsyncStorage.removeItem(RECONNECT_TOKEN_KEY);
};
```

### **Initialisation Socket.IO : `initSocket()`**

```typescript
const initSocket = async () => {
  // Étape 1 : Chercher un ancien token
  const existingToken = await getReconnectToken();

  // Étape 2 : Créer la connexion Socket.IO
  const newSocket = io(SERVER_URL, {
    reconnection: true, // Reconnecter automatiquement si déconnecté
    reconnectionDelay: 1000, // Attendre 1 sec avant 1ère tentative
    reconnectionDelayMax: 5000, // Max 5 sec d'attente
    reconnectionAttempts: 10, // Essayer 10 fois max
    auth: {
      token: existingToken || "", // Envoyer le token au serveur (peut être vide)
    },
  });

  // Étape 3 : Récupérer l'instance
  return newSocket;
};
```

**Détails importants** :

- `reconnectionDelay: 1000` : attendre 1000ms avant de reconnecter
- `reconnectionDelayMax: 5000` : mais ne pas dépasser 5000ms
- `reconnectionAttempts: 10` : essayer 10 fois puis abandonner
- L'augmentation du délai = exponential backoff (1s → 2s → 3s... → 5s)

### **Export final**

```typescript
const socket = await initSocket();
export default socket;
```

**Important** : Un seul instance Socket.IO est créée et réutilisée partout

---

## Flux : Comment socketService.ts et useSocket.ts dialoguent

```
socketService.ts (création Socket.IO)
  ↓
initSocket() crée socket avec token si existe
  ↓
socket = io(SERVER_URL, { auth: token })
  ↓
useSocket.ts importe ce socket
  ↓
socket.on("connect", ...) écoute la connexion
  ↓
Si connexion réussie → useSocket.ts active l'UI
Si reconnect → serveur envoie les données existantes
```

---

# 🟢 PARTIE 2 : SERVEUR NODE.JS - Server.js

**Fichier** : `/server/server.js`
**Rôle** : Accepter les connexions, générer tokens, stocker les données, gérer l'expiration

## Initialisation serveur

```javascript
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
```

## Données serveur (base de données en mémoire)

```javascript
// Structure: { socketId: { username, token, profileImage, etc } }
const clients = {};

// Structure: { token: { socketId, username, profileImage, expiresAt } }
// Permet de valider les tokens au reconnexion
const tokens = {};
```

**Explication** :

- `clients[socketId]` : données de la connexion ACTUELLE
- `tokens[token]` : données persistantes (valide 7 jours)

### **Exemple de données stockées**

```javascript
// Après qu'Alice se connecte et sauvegarde son username + photo
clients = {
  abc123xyz: {
    username: "Alice",
    token: "token_abc123xyz_1701234567890",
    profileImage: "data:image/jpeg;base64,/9j/4AAQSkZJR...",
  },
};

tokens = {
  token_abc123xyz_1701234567890: {
    socketId: "abc123xyz",
    username: "Alice",
    profileImage: "data:image/jpeg;base64,/9j/4AAQSkZJR...",
    expiresAt: 1702439367890, // 7 jours plus tard
  },
};
```

## Nettoyage automatique des tokens expirés

```javascript
// Constantes
const TOKEN_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // 7 jours en ms
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Toutes les heures

// Fonction de nettoyage
const cleanupExpiredTokens = () => {
  const now = Date.now();
  let deleted = 0;

  // Parcourir TOUS les tokens
  for (const token in tokens) {
    // Si le token est plus vieux que 7 jours
    if (tokens[token].expiresAt < now) {
      // Supprimer le token
      delete tokens[token];
      deleted++;
    }
  }

  if (deleted > 0) {
    console.log(`🧹 ${deleted} tokens expirés supprimés`);
  }
};

// Lancer le nettoyage toutes les heures
setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL);
```

**Pourquoi ?** Sans ça, la mémoire du serveur se remplit de tokens jamais utilisés

## Événement de connexion

```javascript
io.on("connection", (socket) => {
  console.log(`✅ Client connecté: ${socket.id}`);

  // Le client envoie un token au serveur dans les paramètres d'auth
  const token = socket.handshake.auth.token;

  if (token && tokens[token]) {
    // === RECONNEXION: Token trouvé et valide ===

    console.log(`🔄 Reconnexion détectée avec token: ${token}`);

    const existingData = tokens[token];
    const oldSocketId = existingData.socketId;

    // Mettre à jour le socketId (la connexion a un nouvel ID)
    tokens[token].socketId = socket.id;

    // Ajouter aux clients ACTIFS
    clients[socket.id] = {
      username: existingData.username,
      token: token,
      profileImage: existingData.profileImage,
    };

    // Notifier le CLIENT: "tu es reconnecté, voici tes données"
    socket.emit("reconnected", {
      username: existingData.username,
      profileImage: existingData.profileImage || null,
    });

    console.log(
      `✅ ${existingData.username} reconnecté (ancien: ${oldSocketId}, nouveau: ${socket.id})`,
    );
  } else {
    // === PREMIÈRE CONNEXION: Pas de token ===
    console.log(`🆕 Nouvelle connexion (pas de token)`);
  }
});
```

**Détails clés** :

- `socket.handshake.auth.token` : récupère le token envoyé par le client
- `tokens[token]` : cherche le token dans la base
- `socket.emit("reconnected", ...)` : envoie AU CLIENT reconnecté

## Événement : Utilisateur sauvegarde le username

```javascript
socket.on("set-username", (data) => {
  const { username } = data;

  // Vérifier si ce socket a déjà un token (reconnexion précédente)
  const existingToken = clients[socket.id]?.token;

  let token;

  if (existingToken && tokens[existingToken]) {
    // === RÉUTILISER le token existant ===
    token = existingToken;
    tokens[token].username = username; // Mettre à jour le username
  } else {
    // === GÉNÉRER un nouveau token ===
    token = `token_${socket.id}_${Date.now()}`;

    tokens[token] = {
      socketId: socket.id,
      username: username,
      profileImage: null,
      expiresAt: Date.now() + TOKEN_EXPIRATION_TIME,
    };
  }

  // Sauvegarder aux clients ACTIFS
  clients[socket.id] = {
    username: username,
    token: token,
    profileImage: clients[socket.id]?.profileImage || null,
  };

  console.log(
    `📝 Username sauvegardé: ${socket.id} -> ${username} (token: ${token})`,
  );

  // Envoyer le token AU CLIENT pour qu'il le sauvegarde
  socket.emit("username-saved", {
    success: true,
    username: username,
    token: token, // ← Important : le client reçoit le token
  });
});
```

**Logique cruciale** :

- Première fois : créer un nouveau token
- Reconnexion : réutiliser le même token (pour que les données persistent)

## Événement : Utilisateur upload une photo

```javascript
socket.on("upload-profile-image", (data) => {
  const { imageBase64 } = data; // Reçoit l'image en base64

  // Récupérer le token du client
  const token = clients[socket.id]?.token;

  if (!token) {
    console.log("❌ Pas de token pour upload image");
    return;
  }

  // Sauvegarder l'image DANS le token persistant
  tokens[token].profileImage = imageBase64;

  // Et aussi dans les clients actifs
  clients[socket.id].profileImage = imageBase64;

  console.log(
    `📸 Photo de profil sauvegardée pour ${clients[socket.id].username}`,
  );

  // Confirmer AU CLIENT
  socket.emit("profile-image-saved", {
    success: true,
    message: "Photo de profil sauvegardée!",
  });
});
```

**Important** : La photo est sauvegardée DANS le token, donc elle persiste 7 jours

## Événement : Déconnexion

```javascript
socket.on("disconnect", () => {
  const username = clients[socket.id]?.username || "inconnu";
  console.log(`❌ Client déconnecté: ${socket.id} (${username})`);

  // Ne pas supprimer immédiatement
  // Laisser le token survivre pour reconnexion (jusqu'à expiration)
  delete clients[socket.id];
});
```

**Note** : On supprime de `clients` (actifs) mais le `tokens` reste (pour reconnect)

---

# 🟠 PARTIE 3 : FRONTEND - useSocket.ts Hook

**Fichier** : `/front/hooks/useSocket.ts`
**Rôle** : Gérer tous les événements Socket.IO, stocker les données, exposer aux composants

## Imports

```typescript
import { useEffect, useState } from "react";
import socket from "@/services/socketService";
```

## État local (useState)

```typescript
const [isConnected, setIsConnected] = useState(false);
const [savedUsername, setSavedUsername] = useState("");
const [profileImage, setProfileImage] = useState<string | null>(null);
const [reconnectAttempts, setReconnectAttempts] = useState(0);
const [isTokenValid, setIsTokenValid] = useState(true);
```

**Chaque état** :

- `isConnected` : connecté au serveur ?
- `savedUsername` : "Alice" ou "" si pas défini
- `profileImage` : "data:image/..." ou null
- `reconnectAttempts` : nombre de tentatives de reconnexion
- `isTokenValid` : le token est-il valide ? (false = expiré)

## Fonction d'initialisation

```typescript
const setupSocket = () => {
  // Événement 1 : Connecté avec succès
  socket.on("connect", () => {
    setIsConnected(true);
    setReconnectAttempts(0);
    console.log("✅ Socket connecté");
  });

  // Événement 2 : Déconnecté
  socket.on("disconnect", () => {
    setIsConnected(false);
    console.log("❌ Socket déconnecté");
  });

  // Événement 3 : Reconnexion réussie
  // (Serveur envoie les anciennes données)
  socket.on("reconnected", (data: any) => {
    setSavedUsername(data.username);
    setProfileImage(data.profileImage || null);
    setIsTokenValid(true);
    console.log(`🔄 Reconnecté en tant que: ${data.username}`);
  });

  // Événement 4 : Username confirmé par serveur
  socket.on("username-saved", (data: any) => {
    setSavedUsername(data.username);
    console.log(`💾 Username confirmé: ${data.username}`);
  });

  // Événement 5 : Photo confirmée par serveur
  socket.on("profile-image-saved", (data: any) => {
    console.log("📸 Photo confirmée par serveur");
  });

  // Événement 6 : Token expiré
  socket.on("token-expired", () => {
    setIsTokenValid(false);
    setSavedUsername("");
    setProfileImage(null);
    console.log("⏰ Token expiré, veuillez vous reconnecter");
  });

  // Si déjà connecté (reconnexion depuis le cache)
  if (socket.connected) {
    setIsConnected(true);
  }
};
```

## useEffect principal

```typescript
useEffect(() => {
  setupSocket(); // Enregistrer les écouteurs

  // Cleanup : arrêter d'écouter en quittant
  return () => {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("reconnected");
    socket.off("username-saved");
    socket.off("profile-image-saved");
    socket.off("token-expired");
  };
}, []); // Vide = une seule fois au montage
```

## Fonction d'envoi du username

```typescript
const handleSaveUsername = (username: string) => {
  // Envoyer au serveur
  socket.emit("set-username", { username });
  console.log(`📤 Username envoyé: ${username}`);
};
```

## Fonction d'upload de photo

```typescript
const handleUploadProfileImage = (imageBase64: string) => {
  // Envoyer la photo en base64 au serveur
  socket.emit("upload-profile-image", { imageBase64 });
  console.log(`📤 Photo envoyée au serveur`);
};
```

## Retour du hook

```typescript
return {
  isConnected,
  savedUsername,
  profileImage,
  isTokenValid,
  reconnectAttempts,
  handleSaveUsername,
  handleUploadProfileImage,
};
```

---

# 🟡 PARTIE 4 : FRONTEND - Composants React Native

## index.tsx - Page principale

```typescript
import { useSocket } from "@/hooks/useSocket";
import AddPicture from "@/components/addPicture";
import UsernameInput from "@/components/usernameInput";

export default function HomeScreen() {
  const {
    isConnected,
    savedUsername,
    profileImage,
    isTokenValid,
    handleSaveUsername,
  } = useSocket();

  return (
    <View>
      {/* Affichage du statut */}
      <Text style={{ color: isConnected ? "#4CAF50" : "#F44336" }}>
        {isConnected ? "✅ Connecté" : "❌ Déconnecté"}
      </Text>

      {/* Si token expiré, afficher message */}
      {!isTokenValid && (
        <Text style={{ color: "#FF9800" }}>
          ⏰ Token expiré, veuillez saisir un nouveau pseudo
        </Text>
      )}

      {/* Si connecté, afficher les composants */}
      {isConnected && (
        <>
          {/* Bouton + pour photo */}
          <AddPicture
            onUploadImage={handleUploadProfileImage}
            initialImage={profileImage}
          />

          {/* Input pour username */}
          <UsernameInput onSaveUsername={handleSaveUsername} />

          {/* Affichage du username sauvegardé */}
          {savedUsername && <Text>Pseudo: {savedUsername}</Text>}
        </>
      )}
    </View>
  );
}
```

**Flux des données** :

1. `useSocket()` récupère l'état et les fonctions
2. Passe `handleSaveUsername` à `UsernameInput`
3. Passe `handleUploadProfileImage` à `AddPicture`
4. Affiche `savedUsername` et `profileImage` quand disponibles

## addPicture.tsx - Bouton circulaire pour photo

```typescript
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { readAsStringAsync } from "expo-file-system/legacy";
import { View, Pressable, Image, Alert } from "react-native";

interface Props {
  onUploadImage?: (imageBase64: string) => void;
  initialImage?: string | null;
}

export default function AddPicture({ onUploadImage, initialImage }: Props) {
  const [image, setImage] = useState<string | null>(null);

  // Mettre à jour l'image si initialImage change (reconnexion)
  useEffect(() => {
    if (initialImage) {
      setImage(initialImage);
    }
  }, [initialImage]);

  // Fonction: Sélectionner une image
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.cancelled) {
        // Convertir en base64
        const imageBase64 = await readAsStringAsync(result.uri, {
          encoding: "base64",
        });

        const base64Image = `data:image/jpeg;base64,${imageBase64}`;
        setImage(base64Image);

        // Envoyer au serveur
        onUploadImage?.(base64Image);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger l'image");
    }
  };

  return (
    <Pressable
      onPress={pickImage}
      style={{
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#007AFF",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
          }}
        />
      ) : (
        <Text style={{ fontSize: 40 }}>+</Text>
      )}
    </Pressable>
  );
}
```

**Points clés** :

- `ImagePicker.launchImageLibraryAsync()` : ouvre la galerie
- `readAsStringAsync(..., encoding: "base64")` : convertit en base64
- `useEffect([initialImage])` : met à jour l'affichage lors reconnexion

## usernameInput.tsx - Input pour le pseudo

```typescript
import { useState } from "react";
import { TextInput, Pressable, Text, View } from "react-native";

interface Props {
  onSaveUsername?: (username: string) => void;
}

export default function UsernameInput({ onSaveUsername }: Props) {
  const [value, setValue] = useState("");

  const handleSave = () => {
    if (value.trim()) {
      onSaveUsername?.(value);  // Envoyer au hook
      setValue("");             // Vider l'input
    }
  };

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Entrez votre pseudo..."
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          marginBottom: 10,
        }}
      />
      <Pressable onPress={handleSave}>
        <Text>✓ Valider</Text>
      </Pressable>
    </View>
  );
}
```

---

# 🔴 PARTIE 5 : FLUX COMPLET - Scénario réaliste

## Scénario 1 : Première connexion

```
ÉTAPE 1 : App démarre
├─ index.tsx se monte
├─ useSocket() s'exécute
├─ setupSocket() enregistre les écouteurs
├─ socketService retourne un socket
└─ Connexion au serveur commence

ÉTAPE 2 : Connexion établie
├─ socket.on("connect") se déclenche
├─ setIsConnected(true)
├─ Affichage: "✅ Connecté"
└─ UI devient interactive

ÉTAPE 3 : Utilisateur tape "Alice"
├─ onChangeText="Alice" dans TextInput
├─ handleSave() s'exécute au clic "Valider"
├─ onSaveUsername("Alice") appelé
└─ socket.emit("set-username", { username: "Alice" })

ÉTAPE 4 : Serveur reçoit
├─ socket.on("set-username") s'exécute
├─ Génère token = "token_abc123xyz_1701234567890"
├─ tokens[token] = { socketId, username: "Alice", expiresAt: ... }
├─ clients[abc123xyz] = { username: "Alice", token }
└─ socket.emit("username-saved", { username: "Alice", token })

ÉTAPE 5 : Client reçoit confirmation
├─ socket.on("username-saved") s'exécute
├─ setSavedUsername("Alice")
├─ Affichage: "Pseudo: Alice"
└─ saveReconnectToken(token) sauvegarde dans AsyncStorage

ÉTAPE 6 : Utilisateur sélectionne une photo
├─ Clique sur bouton "+"
├─ ImagePicker s'ouvre
├─ Sélectionne photo
├─ readAsStringAsync() convertit en base64
├─ setImage(base64Image)
└─ onUploadImage(base64Image) appelé

ÉTAPE 7 : Serveur reçoit la photo
├─ socket.on("upload-profile-image") s'exécute
├─ tokens[token].profileImage = base64Image
├─ clients[socket.id].profileImage = base64Image
└─ socket.emit("profile-image-saved")

ÉTAPE 8 : Données finales serveur
├─ clients["abc123xyz"] = {
│   username: "Alice",
│   token: "token_abc123xyz_1701234567890",
│   profileImage: "data:image/jpeg;base64,..."
│ }
└─ tokens["token_abc123xyz_1701234567890"] = {
    socketId: "abc123xyz",
    username: "Alice",
    profileImage: "data:image/jpeg;base64,..."
    expiresAt: 1702439367890  ← 7 jours
  }
```

## Scénario 2 : Reconnexion (app fermée 2 jours)

```
JOUR 3 : Utilisateur ouvre l'app

ÉTAPE 1 : App démarre (socketService.ts)
├─ initSocket() appelé
├─ getReconnectToken() cherche token dans AsyncStorage
├─ Trouve: "token_abc123xyz_1701234567890"
└─ socket = io(SERVER_URL, { auth: { token: "token_..." } })

ÉTAPE 2 : Socket envoie token au serveur
├─ Handshake Socket.IO inclut le token
└─ Serveur reçoit la connexion avec ce token

ÉTAPE 3 : Serveur valide le token
├─ socket.handshake.auth.token = "token_abc123xyz_1701234567890"
├─ Cherche dans tokens[token]
├─ Trouve! Token valide (< 7 jours)
├─ Récupère: username="Alice", profileImage="data:image/..."
└─ Mise à jour socketId (socket.id a changé)

ÉTAPE 4 : Serveur notifie le client reconnecté
├─ socket.emit("reconnected", {
│   username: "Alice",
│   profileImage: "data:image/jpeg;base64,..."
│ })
└─ Ne crée PAS de nouveau token (réutilise l'ancien)

ÉTAPE 5 : Client reçoit "reconnected"
├─ socket.on("reconnected") s'exécute
├─ setSavedUsername("Alice")
├─ setProfileImage("data:image/jpeg;base64,...")
├─ setIsTokenValid(true)
└─ Affichage: "Pseudo: Alice" + photo

ÉTAPE 6 : Données finales
├─ AsyncStorage toujours a token
├─ tokens[token].expiresAt toujours dans 5 jours
└─ L'utilisateur ne voit aucune différence!
```

## Scénario 3 : Token expiré (10 jours après)

```
JOUR 11 : Utilisateur ouvre l'app

ÉTAPE 1 : App démarre
├─ getReconnectToken() retourne "token_abc123xyz_..."
├─ socket.emit avec ce token
└─ Serveur reçoit

ÉTAPE 2 : Serveur valide le token
├─ Cherche dans tokens[token]
├─ Ne trouve pas! (expiré et supprimé par cleanupExpiredTokens)
├─ Traite comme NOUVELLE connexion
└─ socket.emit("token-expired")

ÉTAPE 3 : Client reçoit "token-expired"
├─ socket.on("token-expired") s'exécute
├─ setIsTokenValid(false)
├─ setSavedUsername("")
├─ setProfileImage(null)
└─ Affichage: "⏰ Token expiré, veuillez vous reconnecter"

ÉTAPE 4 : Utilisateur doit retaper son pseudo
├─ Pour recréer un compte (ou un nouveau)
├─ socket.emit("set-username", { username: "Alice" })
└─ Nouveau token généré
```

---

# 🟣 PARTIE 6 : Expiration et Sécurité

## Timeline d'un token

```
Heure 0h
├─ Utilisateur se connecte
├─ Token généré: "token_abc123xyz_1701234567890"
├─ expiresAt = now + 7 jours
└─ Sauvegardé dans tokens{}

Jour 1
├─ Utilisateur ferme et rouvre l'app
├─ Token retrouvé dans AsyncStorage
├─ Envoyé au serveur avec la connexion
├─ tokens[token].expiresAt > now ? OUI → Reconnecté
└─ Pas besoin de retaper le pseudo

Jour 6
├─ Toujours valide (< 7 jours)
├─ Reconnexion toujours possible
└─ Token persiste

Jour 7h00 (exactement 7 jours)
├─ tokens[token].expiresAt = now
├─ Token EST expiré

Jour 7h + 1 heure (nettoyage)
├─ cleanupExpiredTokens() s'exécute (setInterval 1h)
├─ Parcourt TOUS les tokens
├─ Supprime ceux où expiresAt < now
├─ delete tokens[token]
└─ Token n'existe plus en mémoire

Jour 8
├─ Utilisateur lance l'app
├─ Cherche token dans tokens{} → PAS TROUVÉ
├─ Événement "token-expired"
├─ Utilisateur doit retaper pseudo
└─ Nouveau token généré
```

## Configuration d'expiration

```javascript
// Dans server.js
const TOKEN_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000;
//                           = 604800000 millisecondes
//                           = 7 jours
```

Pourquoi 7 jours ?

- Pas trop court (l'app ne demande pas de retaper sans cesse)
- Pas trop long (sécurité, nettoyer les appareils oubliés)

Pourquoi nettoyer toutes les heures ?

- Plus fréquent que l'expiration (1h vs 7j)
- Pas trop fréquent (économiser CPU)
- Limite croissance mémoire

---

# 📋 PARTIE 7 : Résumé des appels de fichier à fichier

## Chaîne d'appels complets

```
index.tsx
  ├─ importe useSocket
  ├─ const { ... } = useSocket()
  └─ passe handleSaveUsername et handleUploadProfileImage à composants

usernameInput.tsx
  ├─ reçoit onSaveUsername en prop
  ├─ socket.emit("set-username") (indirectement via prop)
  └─ affiche les données

addPicture.tsx
  ├─ reçoit onUploadImage en prop
  ├─ reçoit initialImage en prop (pour restauration)
  └─ socket.emit("upload-profile-image") (indirectement)

useSocket.ts (hook)
  ├─ importe socket from socketService
  ├─ socket.on("connect", "disconnect", "username-saved", etc)
  ├─ socket.emit("set-username", "upload-profile-image")
  └─ expose handleSaveUsername, handleUploadProfileImage

socketService.ts
  ├─ initSocket() crée la connexion
  ├─ saveReconnectToken() sauvegarde dans AsyncStorage
  ├─ getReconnectToken() récupère depuis AsyncStorage
  └─ export default socket

server.js
  ├─ io.on("connection") reçoit les clients
  ├─ socket.on("set-username") sauvegarde dans clients{} et tokens{}
  ├─ socket.on("upload-profile-image") sauvegarde en base64
  ├─ socket.emit("reconnected") envoie données restaurées
  ├─ setInterval(cleanupExpiredTokens) supprime les tokens > 7j
  └─ Stockage en mémoire: clients{}, tokens{}
```

## Appels réseau complets

```
PREMIÈRE CONNEXION:
Client → Server: Socket.IO connection (no token)
Client → Server: socket.emit("set-username", { username })
Server → Client: socket.emit("username-saved", { token })
Client (AsyncStorage): saveReconnectToken(token)
Client → Server: socket.emit("upload-profile-image", { imageBase64 })
Server → Client: socket.emit("profile-image-saved", {})

RECONNEXION:
Client (AsyncStorage): getReconnectToken() → "token_..."
Client → Server: Socket.IO connection + auth: { token }
Server: token valide? OUI
Server → Client: socket.emit("reconnected", { username, profileImage })
Client: restore l'état React
```

---

# ✅ Points clés finaux

### **Sauvegardes multiples**

- **Client AsyncStorage** : token (survit app restart)
- **Client React state** : username, profileImage (perdu au restart)
- **Server memory** : clients{}, tokens{} (perdu au redémarrage serveur)

### **Tokens**

- Format: `token_${socketId}_${timestamp}`
- Durée: 7 jours
- Nettoyage: Toutes les heures
- Usage: Identifier un utilisateur sur reconnexion

### **Événements clés**

| Événement              | Émetteur | Récepteur | Usage               |
| ---------------------- | -------- | --------- | ------------------- |
| "set-username"         | Client   | Server    | Envoyer pseudo      |
| "username-saved"       | Server   | Client    | Confirmer + token   |
| "upload-profile-image" | Client   | Server    | Envoyer photo       |
| "profile-image-saved"  | Server   | Client    | Confirmer photo     |
| "reconnected"          | Server   | Client    | Restaurer données   |
| "token-expired"        | Server   | Client    | Notifier expiration |

### **Architecture**

```
React Components (UI)
         ↓
useSocket Hook (Logic)
         ↓
socketService (Connection)
         ↓
Socket.IO Client
         ↓ WebSocket
Socket.IO Server (Node.js)
         ↓
Mémoire (clients{}, tokens{})
```
