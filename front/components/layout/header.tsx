import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Font from "expo-font";
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from "@/constants/theme";
import UserIcon from "@/assets/images/userIcon";
import QrIcon from "@/assets/images/qrIcon";
import { useSocket } from "@/hooks/useSocket";
import AddPicture from "@/components/inputs/addPicture";
import Input from "@/components/inputs/usernameInput";

interface HeaderProps {
  username?: string;
  profileImage?: string | null;
  onQRPress?: () => void;
}

export default function Header({
  username = "username",
  profileImage,
  onQRPress,
}: HeaderProps) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);
  const [currentImageFileName, setCurrentImageFileName] = useState<string | null>(null);

  const { handleSaveUsername, handleUploadProfileImage } = useSocket();

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          Fedoka: require("@/assets/fonts/Fredoka-VariableFont_wdth,wght.ttf"),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error("Erreur chargement font:", error);
        setFontsLoaded(true);
      }
    };
    loadFonts();
  }, []);

  const handleSave = () => {
    if (currentUsername.trim()) {
      handleSaveUsername(currentUsername);
    }
    if (currentImageBase64 && currentImageFileName) {
      handleUploadProfileImage(currentImageBase64, currentImageFileName);
    }
    setModalVisible(false);
  };

  const canSave = currentUsername.trim() || currentImageBase64;

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Profile + Username (align left) */}
      <Pressable style={styles.profileSection} onPress={() => setModalVisible(true)}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <UserIcon width={55} height={55} />
        )}
        <Text style={styles.username}>{username}</Text>
      </Pressable>

      {/* QR Code (auto flex right) */}
      <Pressable onPress={onQRPress} style={styles.qrButton}>
        <QrIcon width={60} height={60} />
      </Pressable>

      {/* Modal édition profil */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le profil</Text>

            <AddPicture
              initialImage={profileImage}
              onImageChange={(base64, fileName) => {
                setCurrentImageBase64(base64);
                setCurrentImageFileName(fileName);
              }}
            />

            <Input onUsernameChange={setCurrentUsername} variant="dark" />

            {canSave && (
              <Pressable style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </Pressable>
            )}

            <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>
          </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingTop: SPACING.lg * 3,
    backgroundColor: COLORS.background.secondary,
    borderBottomLeftRadius: BORDER_RADIUS.header,
    borderBottomRightRadius: BORDER_RADIUS.header,
  },

  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg,
  },

  profileImage: {
    width: 55,
    height: 55,
    borderRadius: BORDER_RADIUS.profile,
  },

  username: {
    fontSize: TYPOGRAPHY.sizes.header,
    fontWeight: "700",
    color: COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fonts.fedoka,
  },

  qrButton: {
    padding: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: BORDER_RADIUS.header,
    borderTopRightRadius: BORDER_RADIUS.header,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg * 2,
    alignItems: "center",
    gap: SPACING.lg,
  },

  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.header,
    fontWeight: "700",
    color: "#fff",
    fontFamily: TYPOGRAPHY.fonts.fedoka,
    marginBottom: SPACING.lg,
  },

  saveButton: {
    width: "100%",
    paddingVertical: 12,
    backgroundColor: "#34C759",
    borderRadius: 8,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  cancelButton: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
  },

  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
  },
});
