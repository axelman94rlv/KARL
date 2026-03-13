import React, { useState, useEffect } from "react";
import { View, Pressable, StyleSheet, Text, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { readAsStringAsync } from "expo-file-system/legacy";

interface AddPictureProps {
  onPictureSelected?: (base64: string, fileName: string) => void;
  onPictureRemoved?: () => void;
  initialImage?: string | null;
  onImageChange?: (base64: string | null, fileName: string | null) => void;
  size?: number;
}

export default function AddPicture({
  onPictureSelected,
  onPictureRemoved,
  initialImage,
  onImageChange,
  size = 80,
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
        const base64 = await readAsStringAsync(imageUri, { encoding: "base64" });
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
      { text: "Annuler", style: "cancel" },
    ]);
  };

  const showOptions = () => {
    Alert.alert("Ajouter une photo de profil", "Choisir une option", [
      { text: "Appareil photo", onPress: () => pickImage(true) },
      { text: "Galerie", onPress: () => pickImage(false) },
      { text: "Annuler", style: "cancel" },
    ]);
  };

  const badgeSize = Math.max(24, size * 0.22);
  const badgeFontSize = badgeSize * 0.5;

  return (
    <View style={styles.container}>
      <View style={{ position: "relative" }}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { width: size, height: size, borderRadius: size / 2 },
            pressed && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={showOptions}
          disabled={isLoading}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={{ width: size, height: size, borderRadius: size / 2 }}
            />
          ) : (
            <Text style={[styles.buttonText, { fontSize: size * 0.4 }]}>+</Text>
          )}
        </Pressable>

        {/* Croix rouge de suppression */}
        {profileImage && (
          <Pressable
            style={[
              styles.deleteBadge,
              {
                width: badgeSize,
                height: badgeSize,
                borderRadius: badgeSize / 2,
                top: -badgeSize * 0.2,
                right: -badgeSize * 0.2,
              },
            ]}
            onPress={deleteImage}
          >
            <Text style={[styles.deleteBadgeText, { fontSize: badgeFontSize }]}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 20,
  },
  button: {
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
    color: "#fff",
    fontWeight: "bold",
  },
  deleteBadge: {
    position: "absolute",
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  deleteBadgeText: {
    color: "#fff",
    fontWeight: "700",
  },
});
