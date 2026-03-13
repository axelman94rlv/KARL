import {
  Text,
  View,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import Input from "@/components/inputs/usernameInput";
import AddPicture from "@/components/inputs/addPicture";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "expo-router";
import { COLORS, TYPOGRAPHY, SPACING } from "@/constants/theme";

export default function Index() {
  const router = useRouter();
  const {
    isConnected,
    profileImage,
    handleSaveUsername,
    handleUploadProfileImage,
  } = useSocket();

  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);
  const [currentImageFileName, setCurrentImageFileName] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [isLeaving, setIsLeaving] = useState(false);

  const cardTranslateY = useRef(new Animated.Value(-400)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardTranslateY, cardOpacity]);

  const isReadyToSend =
    (currentUsername.trim() || currentImageBase64) && isConnected;

  const handleSendAll = () => {
    if (isLeaving) return;
    setIsLeaving(true);

    Animated.parallel([
      Animated.timing(cardTranslateY, {
        toValue: -400,
        duration: 380,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        if (currentUsername.trim()) handleSaveUsername(currentUsername);
        if (currentImageBase64 && currentImageFileName) {
          handleUploadProfileImage(currentImageBase64, currentImageFileName);
        }
        router.replace("/homepage");
      }
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Titre */}
        <Text style={styles.title}>KARL</Text>

        {/* Carte de jeu animée */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          {/* Cadre intérieur */}
          <View style={styles.innerBorder} pointerEvents="none" />

          {/* Coin haut gauche */}
          <View style={styles.cornerTopLeft}>
            <Text style={styles.cornerLetter}>K</Text>
            <Text style={styles.cornerSuit}>♥</Text>
          </View>

          {/* AddPicture au centre */}
          <View style={styles.cardCenter}>
            <AddPicture
              initialImage={profileImage}
              size={200}
              onImageChange={(base64, fileName) => {
                setCurrentImageBase64(base64);
                setCurrentImageFileName(fileName);
              }}
            />
          </View>

          {/* Coin bas droite */}
          <View style={[styles.cornerBottomRight, styles.cornerRotated]}>
            <Text style={styles.cornerLetter}>K</Text>
            <Text style={styles.cornerSuit}>♥</Text>
          </View>
        </Animated.View>

        {/* Input username */}
        <View style={styles.inputWrapper}>
          <Input
            onUsernameChange={setCurrentUsername}
            variant="light"
            placeholder="Entre ton pseudo"
          />
        </View>

        {/* Bouton jouez */}
        {isReadyToSend && (
          <Pressable
            style={[styles.sendButton, isLeaving && { opacity: 0.5 }]}
            onPress={handleSendAll}
            disabled={isLeaving}
          >
            <Text style={styles.sendButtonText}>Jouez</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl * 2,
    paddingBottom: SPACING.xxl,
  },

  title: {
    fontSize: 52,
    fontWeight: "700",
    color: COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fonts.fedoka,
    marginBottom: SPACING.xl,
    letterSpacing: 4,
  },

  card: {
    width: "100%",
    aspectRatio: 0.68,
    backgroundColor: "#fff",
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#051934",
    padding: SPACING.lg,
    justifyContent: "space-between",
    shadowColor: "#051934",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginBottom: SPACING.xl,
  },

  cornerTopLeft: {
    alignSelf: "flex-start",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#C0392B",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#fff",
    zIndex: 1,
  },

  cornerBottomRight: {
    alignItems: "center",
    alignSelf: "flex-end",
    borderWidth: 2.5,
    borderColor: "#C0392B",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#fff",
    zIndex: 1,
  },

  cornerLetter: {
    fontSize: 38,
    fontWeight: "700",
    color: "#C0392B",
    lineHeight: 42,
  },

  cornerSuit: {
    fontSize: 32,
    color: "#C0392B",
    lineHeight: 36,
  },

  cornerRotated: {
    transform: [{ rotate: "180deg" }],
  },

  innerBorder: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 2,
    borderColor: "#051934",
    borderRadius: 20,
  },

  cardCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  inputWrapper: {
    width: "100%",
  },

  sendButton: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderRadius: 50,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonText: {
    color: COLORS.background.primary,
    fontWeight: "700",
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.fedoka,
    letterSpacing: 1,
  },
});
