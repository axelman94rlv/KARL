import { useEffect, useState } from "react";
import { initSocket, saveReconnectToken } from "@/services/socketService";
import type { Socket } from "socket.io-client";

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [savedUsername, setSavedUsername] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const setupSocket = async () => {
      const socketInstance = await initSocket();
      setSocket(socketInstance);

      const handleConnect = () => {
        setIsConnected(true);
        setIsReconnecting(false);
        console.log("✅ Socket connecté");
      };

      const handleDisconnect = (reason: string) => {
        setIsConnected(false);
        console.log("⚠️ Socket déconnecté:", reason);
      };

      const handleUsernameSaved = (data: any) => {
        console.log("💾 Pseudo sauvegardé:", data.username);
        setSavedUsername(data.username);
        if (data.token) {
          saveReconnectToken(data.token);
        }
      };

      const handleProfileImageSaved = (data: any) => {
        console.log("📸 Photo de profil sauvegardée");
        setProfileImage(`data:image/jpeg;base64,${data.profileImage}`);
      };

      const handleReconnected = (data: any) => {
        console.log("🔄 Reconnecté! Pseudo retrouvé:", data.username);
        setSavedUsername(data.username);

        // Restaure la photo si elle existe
        if (data.profileImage) {
          console.log("📸 Photo de profil restaurée");
          setProfileImage(`data:image/jpeg;base64,${data.profileImage}`);
        }

        setIsReconnecting(false);
      };

      const handleTokenExpired = (data: any) => {
        console.log("⏰ Token expiré:", data.message);
        setSavedUsername("");
        setProfileImage(null);
      };

      const handleReconnectAttempt = (attemptNumber: number) => {
        setReconnectAttempt(attemptNumber);
        setIsReconnecting(true);
        console.log(`🔁 Tentative de reconnexion ${attemptNumber}...`);
      };

      socketInstance.on("connect", handleConnect);
      socketInstance.on("disconnect", handleDisconnect);
      socketInstance.on("username-saved", handleUsernameSaved);
      socketInstance.on("profile-image-saved", handleProfileImageSaved);
      socketInstance.on("reconnected", handleReconnected);
      socketInstance.on("token-expired", handleTokenExpired);
      socketInstance.on("reconnect_attempt", handleReconnectAttempt);

      if (socketInstance.connected) {
        setIsConnected(true);
      }

      return () => {
        socketInstance.off("connect", handleConnect);
        socketInstance.off("disconnect", handleDisconnect);
        socketInstance.off("username-saved", handleUsernameSaved);
        socketInstance.off("profile-image-saved", handleProfileImageSaved);
        socketInstance.off("reconnected", handleReconnected);
        socketInstance.off("token-expired", handleTokenExpired);
        socketInstance.off("reconnect_attempt", handleReconnectAttempt);
      };
    };

    setupSocket();
  }, []);

  const handleSaveUsername = (username: string) => {
    if (socket?.connected) {
      socket.emit("set-username", { username });
      console.log(`📤 Pseudo envoyé: ${username}`);
    } else {
      console.log("⚠️ Socket non connecté");
    }
  };

  const handleUploadProfileImage = (base64: string, fileName: string) => {
    if (socket?.connected) {
      socket.emit("upload-profile-image", { profileImage: base64, fileName });
      console.log(`📤 Photo de profil envoyée: ${fileName}`);
    } else {
      console.log("⚠️ Socket non connecté");
    }
  };

  return {
    isConnected,
    savedUsername,
    profileImage,
    handleSaveUsername,
    handleUploadProfileImage,
    reconnectAttempt,
    isReconnecting,
  };
};
