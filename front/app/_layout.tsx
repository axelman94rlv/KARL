import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    console.log("🔌 Initialisation Socket.IO...");

    return () => {};
  }, []);

  return <Stack />;
}
