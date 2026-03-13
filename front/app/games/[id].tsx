import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, TYPOGRAPHY, SPACING } from "@/constants/theme";
import { GAMES, GameKey } from "@/constants/gameConfig";

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const game = GAMES[id as GameKey];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{game?.name ?? id}</Text>
      <Text style={styles.subtitle}>Jeu à venir...</Text>
      <Pressable style={styles.backButton} onPress={() => router.replace("/homepage")}>
        <Text style={styles.backButtonText}>← Retour</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: "700",
    color: COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fonts.fedoka,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.secondary,
    fontFamily: TYPOGRAPHY.fonts.fedoka,
  },
  backButton: {
    marginTop: SPACING.xl,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: "600",
    fontFamily: TYPOGRAPHY.fonts.fedoka,
  },
});
