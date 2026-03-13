import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  useEffect(() => {
    console.log("🔌 Initialisation Socket.IO...");
    return () => {};
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="homepage" />
        <Stack.Screen
          name="games/[id]"
          options={{
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
