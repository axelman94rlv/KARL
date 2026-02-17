import React, { useState } from "react";
import { TextInput, View, StyleSheet } from "react-native";

interface InputProps {
  onUsernameChange?: (username: string) => void;
}

export default function Input({ onUsernameChange }: InputProps) {
  const [value, setValue] = useState("");

  const handleChange = (text: string) => {
    setValue(text);
    onUsernameChange?.(text);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Entrez votre pseudo..."
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
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
});
