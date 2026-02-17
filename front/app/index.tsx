import { Text, View, Pressable, StyleSheet } from "react-native";
import React, { useState } from "react";
import Input from "@/components/usernameInput";
import AddPicture from "@/components/addPicture";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  const {
    isConnected,
    savedUsername,
    profileImage,
    handleSaveUsername,
    handleUploadProfileImage,
  } = useSocket();

  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(
    null,
  );
  const [currentImageFileName, setCurrentImageFileName] = useState<
    string | null
  >(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");

  const handleImageChange = (
    base64: string | null,
    fileName: string | null,
  ) => {
    setCurrentImageBase64(base64);
    setCurrentImageFileName(fileName);
  };

  const handleSendAll = () => {
    // Envoie le pseudo
    if (currentUsername.trim()) {
      handleSaveUsername(currentUsername);
    }
    // Envoie la photo
    if (currentImageBase64 && currentImageFileName) {
      handleUploadProfileImage(currentImageBase64, currentImageFileName);
    }

    router.push("/homepage");
  };

  const isReadyToSend =
    (currentUsername.trim() || currentImageBase64) && isConnected;

  return (
    <View style={styles.container}>
      <Text
        style={{
          fontSize: 16,
          marginBottom: 20,
          color: isConnected ? "#4CAF50" : "#F44336",
          fontWeight: "bold",
        }}
      >
        {isConnected ? "✅ Connecté" : "❌ Déconnecté"}
      </Text>

      <AddPicture
        initialImage={profileImage}
        onImageChange={handleImageChange}
      />

      {savedUsername && (
        <Text style={{ fontSize: 14, marginBottom: 10, color: "#007AFF" }}>
          Pseudo: {savedUsername}
        </Text>
      )}

      <Input onUsernameChange={setCurrentUsername} />

      {isReadyToSend && (
        <Pressable style={styles.sendButton} onPress={handleSendAll}>
          <Text style={styles.sendButtonText}>Envoyer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  sendButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: "#34C759",
    borderRadius: 8,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
