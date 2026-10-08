import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { ImageStyle, StyleProp } from "react-native";

export default function ZoomableImage({ uri, style, onPress, viewport }: {
  uri: string;
  style: StyleProp<ImageStyle>;
  onPress?: () => void;
  viewport?: { width: number; height: number };
}) {
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const width = viewport?.width || 0;
  const height = viewport?.height || 0;
  const pinch = Gesture.Pinch().onStart(() => {
    startScale.value = scale.value;
  }).onUpdate((event) => {
    scale.value = Math.min(5, Math.max(1, startScale.value * event.scale));
    x.value = Math.max(-width * (scale.value - 1) / 2, Math.min(width * (scale.value - 1) / 2, x.value));
    y.value = Math.max(-height * (scale.value - 1) / 2, Math.min(height * (scale.value - 1) / 2, y.value));
  }).onFinalize(() => {
    if (!viewport) scale.value = withTiming(1);
  });
  const pan = Gesture.Pan().enabled(!!viewport).maxPointers(1).onStart(() => {
    startX.value = x.value;
    startY.value = y.value;
  }).onUpdate((event) => {
    const maxX = width * (scale.value - 1) / 2;
    const maxY = height * (scale.value - 1) / 2;
    x.value = Math.max(-maxX, Math.min(maxX, startX.value + event.translationX));
    y.value = Math.max(-maxY, Math.min(maxY, startY.value + event.translationY));
  });
  const doubleTap = Gesture.Tap().numberOfTaps(2).enabled(!!viewport).onEnd((_event, success) => {
    if (!success) return;
    scale.value = withTiming(scale.value > 1 ? 1 : 3);
    x.value = withTiming(0);
    y.value = withTiming(0);
  });
  const tap = Gesture.Tap().enabled(!!onPress).onEnd((_event, success) => {
    if (success && onPress) runOnJS(onPress)();
  });
  const zoom = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }] }));
  return <GestureHandlerRootView style={{ overflow: "hidden", ...(viewport || {}) }}>
    <GestureDetector gesture={Gesture.Race(Gesture.Simultaneous(pinch, pan), Gesture.Exclusive(doubleTap, tap))}>
      <Animated.Image source={{ uri }} style={[style, zoom]} resizeMode="contain" />
    </GestureDetector>
  </GestureHandlerRootView>;
}
