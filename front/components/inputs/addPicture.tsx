import React, { useState, useEffect } from "react";
import { View, Pressable, StyleSheet, Text, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { readAsStringAsync } from "expo-file-system/legacy";

interface AddPictureProps {
  onPictureSelected?: (base64: string, fileName: string) => void;
  onPictureRemoved?: () => void;
  initialImage?: string | null;
  onImageChange?: (base64: string | null, fileName: string | null) => void;
}

export default function AddPicture({
  onPictureSelected,
  onPictureRemoved,
  initialImage,
  onImageChange,
}: AddPictureProps) {
  const [profileImage, setProfileImage] = useState<string | null>(
    initialImage || null,
  );
  const [tempImage, setTempImage] = useState<{
    uri: string;
    base64: string;
    fileName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialImage) {
      setProfileImage(initialImage);
      console.log("📸 Image initiale reçue");
    }
  }, [initialImage]);

  const requestPermissions = async () => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

    return (
      cameraStatus.status === "granted" && mediaStatus.status === "granted"
    );
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      setIsLoading(true);

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          "Permission refusée",
          "Vous devez autoriser l'accès à la caméra ou à la galerie",
        );
        return;
      }

      let result;
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"] as any,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"] as any,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const fileName = imageUri.split("/").pop() || "profile.jpg";

        const base64 = await readAsStringAsync(imageUri, {
          encoding: "base64",
        });

        setTempImage({ uri: imageUri, base64, fileName });
        setProfileImage(imageUri);
        onImageChange?.(base64, fileName);
        console.log("📸 Photo sélectionnée");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la sélection de l'image:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors du chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const sendImage = () => {
    if (tempImage) {
      onPictureSelected?.(tempImage.base64, tempImage.fileName);
      setTempImage(null);
      console.log("📤 Photo et pseudo envoyés au serveur");
    }
  };

  const deleteImage = () => {
    Alert.alert("Supprimer la photo", "Êtes-vous sûr?", [
      {
        text: "Supprimer",
        onPress: () => {
          setProfileImage(null);
          setTempImage(null);
          onImageChange?.(null, null);
          onPictureRemoved?.();
          console.log("🗑️ Photo supprimée");
        },
        style: "destructive",
      },
      {
        text: "Annuler",
        style: "cancel",
      },
    ]);
  };

  const showOptions = () => {
    Alert.alert("Ajouter une photo de profil", "Choisir une option", [
      {
        text: "Appareil photo",
        onPress: () => pickImage(true),
      },
      {
        text: "Galerie",
        onPress: () => pickImage(false),
      },
      {
        text: "Annuler",
        style: "cancel",
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          isLoading && styles.buttonDisabled,
        ]}
        onPress={showOptions}
        disabled={isLoading}
      >
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <Text style={styles.buttonText}>+</Text>
        )}
      </Pressable>

      {profileImage && (
        <Pressable
          style={[styles.actionButton, styles.deleteButton]}
          onPress={deleteImage}
        >
          <Text style={styles.actionButtonText}>Supprimer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 20,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "bold",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  buttonGroup: {
    flexDirection: "column",
    gap: 10,
    marginTop: 15,
    alignItems: "center",
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  sendButton: {
    backgroundColor: "#34C759",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
});
