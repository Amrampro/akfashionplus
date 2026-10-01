import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { ImageStyle, StyleProp } from "react-native";

export default function ZoomableImage({ uri, style }: { uri: string; style: StyleProp<ImageStyle> }) {
  const scale = useSharedValue(1);
  const pinch = Gesture.Pinch().onUpdate((event) => {
    scale.value = Math.min(5, Math.max(1, event.scale));
  }).onFinalize(() => { scale.value = withTiming(1); });
  const zoom = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <GestureHandlerRootView style={{ overflow: "hidden" }}>
    <GestureDetector gesture={pinch}>
      <Animated.Image source={{ uri }} style={[style, zoom]} resizeMode="contain" />
    </GestureDetector>
  </GestureHandlerRootView>;
}
