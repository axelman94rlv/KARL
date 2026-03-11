import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
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

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (type === "game" && !isComingSoon) {
      router.push(`/(games)/${id}`);
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

  // Card jeu
  return (
    <Pressable
      style={[
        styles.gameCard,
        {
          backgroundColor: color,
          height: cardHeight,
        },
        isComingSoon && styles.comingSoon,
      ]}
      onPress={handlePress}
    >
      {/* Titre au top, hauteur auto */}
      <View style={[styles.titleSection, { paddingBottom: titleGap }]}>
        <Text style={styles.gameTitle}>{title}</Text>
      </View>

      {/* Image remplit le reste de l'espace */}
      {image && (
        <View style={styles.imageWrapper}>
          <Image
            source={image}
            style={[styles.gameImage, imageHeight && { height: imageHeight }]}
            resizeMode="cover"
          />
        </View>
      )}
    </Pressable>
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
    height: 140, // Sera remplacé dynamiquement
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

  titleOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  imageContainer: {
    flex: 1,
    width: "100%",
    overflow: "hidden" as const,
    justifyContent: "center",
    alignItems: "center",
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
    // Height peut être overridée dynamiquement via imageHeight
    // resizeMode="cover" permet à l'image de dépasser et se faire rogner
  },

  gameDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.primary,
    textAlign: "center",
    fontFamily: TYPOGRAPHY.fonts.fedoka,
  },

  comingSoon: {
    opacity: 0.7,
  },
});
