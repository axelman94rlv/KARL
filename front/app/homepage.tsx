import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import Header from "@/components/layout/header";
import Card from "@/components/card";
import { useSocket } from "@/hooks/useSocket";
import { COLORS, SPACING } from "@/constants/theme";
import { GAMES, PAGE_SECTIONS } from "@/constants/gameConfig";

export default function Homepage() {
  const { savedUsername, profileImage } = useSocket();

  const handleQRPress = () => {
    Alert.alert("QR Code", "Pop-up du salon à venir!");
  };

  // Séparer les jeux par colonne
  const leftGames = Object.values(GAMES).filter(
    (game) => game.column === "left",
  );
  const rightGames = Object.values(GAMES).filter(
    (game) => game.column === "right",
  );

  return (
    <View style={styles.container}>
      <Header
        username={savedUsername || "axelman94"}
        profileImage={profileImage}
        onQRPress={handleQRPress}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Bienvenue - Full Width */}
          <Card
            id={PAGE_SECTIONS.bienvenue.id}
            type="text"
            title={PAGE_SECTIONS.bienvenue.title}
            description={PAGE_SECTIONS.bienvenue.description}
          />

          {/* Grille 2 colonnes */}
          <View style={styles.gridContainer}>
            {/* Colonne Gauche */}
            <View style={styles.gridColumn}>
              {leftGames.map((game: any) => (
                <Card
                  key={game.id}
                  id={game.id}
                  type="game"
                  title={game.name}
                  color={game.color}
                  rows={game.rows}
                  image={game.image}
                  imageHeight={game.imageHeight}
                  titleGap={game.titleGap}
                  isComingSoon={game.isComingSoon}
                />
              ))}
            </View>

            {/* Colonne Droite */}
            <View style={styles.gridColumn}>
              {rightGames.map((game: any) => (
                <Card
                  key={game.id}
                  id={game.id}
                  type="game"
                  title={game.name}
                  color={game.color}
                  rows={game.rows}
                  image={game.image}
                  imageHeight={game.imageHeight}
                  titleGap={game.titleGap}
                  isComingSoon={game.isComingSoon}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.lg,
  },
  gridContainer: {
    flexDirection: "row",
    gap: SPACING.lg,
  },
  gridColumn: {
    flex: 1,
    gap: SPACING.lg,
  },
});
