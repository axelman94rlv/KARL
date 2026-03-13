import React, { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { TYPOGRAPHY } from "@/constants/theme";

interface SwipeUnlockProps {
  onUnlock: () => void;
  color?: string;
  label?: string;
}

const TRACK_WIDTH = 64;
const THUMB_SIZE = 52;
const PADDING = 6;
const TRACK_HEIGHT = 180;

export default function SwipeUnlock({
  onUnlock,
  color = "#34C759",
  label = "Glisser\npour\njouer",
}: SwipeUnlockProps) {
  const translateY = useSharedValue(0);
  const unlocked = useSharedValue(false);

  // maxTranslate is negative (moving up)
  const maxTranslate = TRACK_HEIGHT - THUMB_SIZE - PADDING * 2;

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (unlocked.value) return;
      // translationY is negative when moving up
      const raw = -e.translationY;
      translateY.value = Math.max(0, Math.min(raw, maxTranslate));
    })
    .onEnd(() => {
      if (unlocked.value) return;
      if (translateY.value >= maxTranslate * 0.85) {
        translateY.value = withSpring(maxTranslate, { damping: 15 });
        unlocked.value = true;
        runOnJS(onUnlock)();
      } else {
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -translateY.value }],
  }));

  const labelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [0, maxTranslate * 0.4],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const fillStyle = useAnimatedStyle(() => ({
    height: translateY.value + THUMB_SIZE + PADDING * 2,
  }));

  return (
    <View style={styles.wrapper}>
      <View style={[styles.track, { borderColor: color }]}>
        {/* Remplissage coloré depuis le bas */}
        <Animated.View
          style={[styles.fill, { backgroundColor: color }, fillStyle]}
        />

        {/* Label centré dans la piste */}
        <Animated.Text style={[styles.label, labelStyle]}>
          {label}
        </Animated.Text>

        {/* Thumb draggable en bas */}
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[styles.thumb, { backgroundColor: color }, thumbStyle]}
          >
            <Text style={styles.thumbIcon}>▲</Text>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 8,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_WIDTH / 2,
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  fill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: TRACK_WIDTH / 2,
    opacity: 0.3,
  },
  label: {
    position: "absolute",
    color: "#fff",
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: "600",
    fontFamily: TYPOGRAPHY.fonts.fedoka,
    letterSpacing: 0.5,
    textAlign: "center",
    top: PADDING + THUMB_SIZE / 2 + 8,
    paddingHorizontal: 4,
  },
  thumb: {
    position: "absolute",
    bottom: PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbIcon: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
