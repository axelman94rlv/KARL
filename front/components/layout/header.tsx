import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import * as Font from "expo-font";
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from "@/constants/theme";
import UserIcon from "@/assets/images/userIcon";
import QrIcon from "@/assets/images/qrIcon";

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
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          Fedoka: require("@/assets/fonts/Fredoka-VariableFont_wdth,wght.ttf"),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error("Erreur chargement font:", error);
        setFontsLoaded(true); // Continue même sans font
      }
    };

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Profile + Username (align left) */}
      <View style={styles.profileSection}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <UserIcon width={55} height={55} />
        )}
        <Text style={styles.username}>{username}</Text>
      </View>

      {/* QR Code (auto flex right) */}
      <Pressable onPress={onQRPress} style={styles.qrButton}>
        <QrIcon width={60} height={60} />
      </Pressable>
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
});
