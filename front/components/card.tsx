import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Modal,
  Alert,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from "@/constants/theme";

interface CardProps {
  id: string;
  type: "text" | "game";
  title: string;
  description?: string;
  color?: string;
  rows?: number;
  image?: any;
  imageHeight?: number;
  titleGap?: number;
  isComingSoon?: boolean;
  onPress?: () => void;
}

export default function Card({
  id,
  type,
  title,
  description,
  color,
  rows = 2,
  image,
  imageHeight,
  titleGap = 10,
  isComingSoon = false,
  onPress,
}: CardProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const translateY = useRef(new Animated.Value(800)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const openModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 75,
        mass: 1.2,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 800,
        duration: 380,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setModalVisible(false);
        translateY.setValue(800);
      }
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (type === "game" && !isComingSoon) {
      openModal();
    }
  };

  // Card texte
  if (type === "text") {
    return (
      <View style={[styles.container, styles.textCard]}>
        <Text style={styles.textTitle}>{title}</Text>
        <Text style={styles.textDescription}>{description}</Text>
      </View>
    );
  }

  // Hauteur calculée: 140px par ligne
  const cardHeight = rows * 140;

  return (
    <>
      {/* Card jeu */}
      <Pressable
        style={[
          styles.gameCard,
          { backgroundColor: color, height: cardHeight },
          isComingSoon && styles.comingSoon,
        ]}
        onPress={handlePress}
      >
        <View style={[styles.titleSection, { paddingBottom: titleGap }]}>
          <Text style={styles.gameTitle}>{title}</Text>
        </View>

        {image && (
          <View style={styles.imageWrapper}>
            <Image
              source={image}
              style={[styles.gameImage, imageHeight ? { height: imageHeight } : undefined]}
              resizeMode="contain"
            />
          </View>
        )}
      </Pressable>

      {/* Modale */}
      <Modal
        visible={modalVisible}
        animationType="none"
        transparent={true}
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          {/* Backdrop animé */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          </Animated.View>

          {/* Sheet animée : monte depuis le bas */}
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: color },
              { transform: [{ translateY }] },
            ]}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.sheetScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Titre */}
              <Text style={styles.modalTitle}>{title}</Text>

              {/* Image */}
              <View style={styles.modalImageContainer}>
                <Image source={require("@/assets/images/mario.png")} style={styles.modalImage} resizeMode="cover" />
              </View>

              {/* Corps blanc */}
              <View style={styles.modalBody}>
                {description && (
                  <Text style={styles.modalDescription}>{description}</Text>
                )}
                <Pressable
                  style={[styles.rulesBtn, { borderColor: color }]}
                  onPress={() => Alert.alert("Règles", "Les règles du jeu à venir !")}
                >
                  <Text style={[styles.rulesBtnText, { color: color }]}>Règles</Text>
                </Pressable>
              </View>

              {/* Bouton JOUER */}
              <Pressable
                style={styles.playBtn}
                onPress={() => {
                  closeModal();
                  setTimeout(() => router.push(`/games/${id}`), 400);
                }}
              >
                <Text style={[styles.playBtnText, { color: color }]}>JOUER</Text>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    justifyContent: "center",
    alignItems: "center",
  },

  // Text Card
  textCard: {
    backgroundColor: COLORS.background.secondary,
    minHeight: 120,
  },
  textTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: "700" as const,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.fonts.fedoka,
  },
  textDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.secondary,
    lineHeight: 24,
    textAlign: "center",
    fontFamily: TYPOGRAPHY.fonts.fedoka,
  },

  // Game Card
  gameCard: {
    height: 140,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden" as const,
    flexDirection: "column" as const,
  },
  titleSection: {
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  gameTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: "700",
    color: COLORS.text.primary,
    textAlign: "center",
    fontFamily: TYPOGRAPHY.fonts.fedoka,
  },
  imageWrapper: {
    flex: 1,
    width: "100%",
    overflow: "hidden" as const,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  gameImage: {
    width: "100%",
    height: "100%",
  },
  comingSoon: {
    opacity: 0.7,
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 170,
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderRadius: 24,
    overflow: "hidden",
    flex: 1,
  },
  sheetScroll: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },

  modalTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    fontFamily: TYPOGRAPHY.fonts.fedoka,
    textAlign: "center",
    paddingTop: 20,
    paddingBottom: 10,
  },

  modalImageContainer: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },

  modalBody: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: "center",
    gap: SPACING.md,
  },
  modalDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: "white",
    fontFamily: TYPOGRAPHY.fonts.fedoka,
    textAlign: "center",
    lineHeight: 22,
  },
  rulesBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 2,
  },
  rulesBtnText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: "700",
    fontFamily: TYPOGRAPHY.fonts.fedoka,
  },

  playBtn: {
    width: "100%",
    paddingVertical: 18,
    backgroundColor: "#fff",
    borderRadius: 50,
    alignItems: "center",
  },
  playBtnText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: "700",
    fontFamily: TYPOGRAPHY.fonts.fedoka,
    letterSpacing: 2,
  },
});
