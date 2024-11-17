import { Stack } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { PenSquare } from 'lucide-react-native';

export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Tin nhắn",
          headerStyle: {
            backgroundColor: '#F5F5F0',
          },
          headerTitleStyle: {
            color: '#2F1810',
          },
          headerShadowVisible: false,
          headerRight: () => (
            <View className="px-4 py-2">
              <TouchableOpacity>
                <PenSquare size={24} color="#8B4513" strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
    </Stack>
  );
}