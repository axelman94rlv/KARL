import React, { useState } from "react";
import { TextInput, View, StyleSheet } from "react-native";

interface InputProps {
  onUsernameChange?: (username: string) => void;
  variant?: "light" | "dark";
  placeholder?: string;
}

export default function Input({
  onUsernameChange,
  variant = "dark",
  placeholder = "Entrez votre pseudo...",
}: InputProps) {
  const [value, setValue] = useState("");

  const handleChange = (text: string) => {
    setValue(text);
    onUsernameChange?.(text);
  };

  const isLight = variant === "light";

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, isLight ? styles.inputLight : styles.inputDark]}
        placeholder={placeholder}
        placeholderTextColor={isLight ? "rgba(5,25,52,0.4)" : "rgba(255,255,255,0.5)"}
        value={value}
        onChangeText={handleChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  input: {
    borderRadius: 50,
    paddingHorizontal: 24,
    paddingVertical: 14,
    fontSize: 16,
  },
  inputLight: {
    backgroundColor: "#fff",
    color: "#051934",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputDark: {
    borderWidth: 1,
    borderColor: "#ccc",
    color: "#fff",
  },
});
