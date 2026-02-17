import { Text, View } from "react-native";
import React from "react";
import Input from "@/components/usernameInput";
import AddPicture from "@/components/addPicture";
import { useSocket } from "@/hooks/useSocket";

export default function Index() {
  const {
    isConnected,
    savedUsername,
    profileImage,
    handleSaveUsername,
    handleUploadProfileImage,
  } = useSocket();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
      }}
    >
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
        onPictureSelected={handleUploadProfileImage}
        initialImage={profileImage}
      />

      {savedUsername && (
        <Text style={{ fontSize: 14, marginBottom: 10, color: "#007AFF" }}>
          Pseudo: {savedUsername}
        </Text>
      )}

      <Input onSaveUsername={handleSaveUsername} />
    </View>
  );
}
