import React from "react";
import { View, StyleSheet } from "react-native";
import { SPACING } from "@/constants/theme";

interface CardRowProps {
  children: React.ReactNode;
}

export default function CardRow({ children }: CardRowProps) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: SPACING.lg,
  },
});
