import { Stack } from "expo-router";
import { View } from "react-native";

export default function WelcomeLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack 
        screenOptions={{
          headerShown: false,  // Ẩn header
          contentStyle: { backgroundColor: '#F5F5F0' },
          animation: 'slide_from_right'  // Thêm animation chuyển trang
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="features" />
        <Stack.Screen name="start" />
      </Stack>
    </View>
  );
}