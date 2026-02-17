import React, { useState, useEffect } from "react";
import { View, Pressable, StyleSheet, Text, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { readAsStringAsync } from "expo-file-system/legacy";

interface AddPictureProps {
  onPictureSelected?: (base64: string, fileName: string) => void;
  initialImage?: string | null;
}

export default function AddPicture({
  onPictureSelected,
  initialImage,
}: AddPictureProps) {
  const [profileImage, setProfileImage] = useState<string | null>(
    initialImage || null,
  );
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
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const fileName = imageUri.split("/").pop() || "profile.jpg";

        // Convertir l'image en base64 avec l'API legacy
        const base64 = await readAsStringAsync(imageUri, {
          encoding: "base64",
        });

        // Affiche l'image localement
        setProfileImage(imageUri);

        // Envoie au serveur
        onPictureSelected?.(base64, fileName);

        console.log("📸 Image sélectionnée et envoyée au serveur");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la sélection de l'image:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors du chargement");
    } finally {
      setIsLoading(false);
    }
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
        onPress: () => {},
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
          <Image
            source={
              profileImage.startsWith("data:")
                ? { uri: profileImage }
                : { uri: profileImage }
            }
            style={styles.profileImage}
          />
        ) : (
          <Text style={styles.buttonText}>+</Text>
        )}
      </Pressable>
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
    transform: [{ scale: 0.95 }],
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
});
