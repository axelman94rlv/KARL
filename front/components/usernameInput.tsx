import React, { useState } from "react";
import { TextInput, View, StyleSheet, Pressable, Text } from "react-native";

interface InputProps {
  onSaveUsername?: (username: string) => void;
}

export default function Input({ onSaveUsername }: InputProps) {
  const [value, setValue] = useState("");

  const handleSave = () => {
    if (value.trim()) {
      onSaveUsername?.(value);
      setValue("");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Entrez votre pseudo..."
        value={value}
        onChangeText={setValue}
      />
      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Envoyer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
