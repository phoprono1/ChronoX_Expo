import { Stack } from "expo-router";

export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Profile",
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerShown: false
        }}
      />
      <Stack.Screen name="top_tabs" />
    </Stack>
  );
}
