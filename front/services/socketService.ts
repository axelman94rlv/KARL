import { io } from "socket.io-client";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let URL = process.env.EXPO_PUBLIC_SOCKET_URL;

if (Platform.OS === "android" && URL?.includes("192.168")) {
  URL = "http://10.0.2.2:3000";
}

let socket: any = null;
let reconnectToken: string | null = null;

export const initSocket = async () => {
  if (socket?.connected) return socket;

  // Récupère le token stocké
  reconnectToken = await AsyncStorage.getItem("reconnectToken");

  socket = io(URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    timeout: 20000,
    auth: {
      token: reconnectToken || null,
    },
  });

  socket.on("connect", () => {
    console.log("✅ Socket connecté:", socket.id);
  });

  socket.on("disconnect", (reason: string) => {
    console.log("⚠️ Socket déconnecté:", reason);
  });

  socket.on("connect_error", (error: any) => {
    console.log("❌ Erreur de connexion:", error);
  });

  socket.on("reconnect_attempt", (attemptNumber: number) => {
    console.log(`🔁 Tentative de reconnexion ${attemptNumber}...`);
  });

  socket.on("reconnect", (attemptNumber: number) => {
    console.log(`🔄 Reconnexion réussie après ${attemptNumber} tentatives`);
  });

  return socket;
};

export const getSocket = () => socket;

export const saveReconnectToken = async (token: string) => {
  reconnectToken = token;
  await AsyncStorage.setItem("reconnectToken", token);
  console.log("🔑 Token sauvegardé localement");
};

export const clearReconnectToken = async () => {
  reconnectToken = null;
  await AsyncStorage.removeItem("reconnectToken");
  console.log("🗑️ Token supprimé");
};
