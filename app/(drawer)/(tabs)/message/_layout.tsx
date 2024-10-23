import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { TouchableOpacity, View } from "react-native";

export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Tin nhắn",

          headerRight: () => (
            <View className="px-4 py-2 flex-row justify-between items-center">
              <TouchableOpacity>
                <Ionicons name="create-outline" size={24} color="black" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
    </Stack>
  );
}
