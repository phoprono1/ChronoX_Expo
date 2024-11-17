import { Stack } from "expo-router";

export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Hồ sơ",
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerShown: false,
          headerStyle: {
            backgroundColor: '#F5F5F0',
          },
          headerLargeTitleStyle: {
            color: '#2F1810',
          },
        }}
      />
    </Stack>
  );
}