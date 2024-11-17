import { Stack } from "expo-router";

export default function SearchDetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom", // hoặc 'slide_from_bottom'
        animationDuration: 200,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        presentation: "card",
        animationTypeForReplace: "push",
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
