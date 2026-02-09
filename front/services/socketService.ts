import { io } from "socket.io-client";
import { Platform } from "react-native";

let URL = process.env.EXPO_PUBLIC_SOCKET_URL;

if (Platform.OS === "android" && URL.includes("192.168")) {
  URL = "http://10.0.2.2:3000";
}

export const socket = io(URL, {
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("✅ Socket connecté:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Socket déconnecté");
});

socket.on("connect_error", (error: any) => {
  console.log("❌ Erreur de connexion:", error);
});

export default socket;
