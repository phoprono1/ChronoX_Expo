import { View, Text, FlatList, Dimensions } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInRight } from "react-native-reanimated";
import { TouchableOpacity } from "react-native-gesture-handler";
import { MessageCircle, Image as ImageIcon, Heart, Users } from "lucide-react-native";

const features = [
  {
    icon: <ImageIcon size={32} color="#8B4513" />,
    title: "Chia sẻ khoảnh khắc",
    description: "Đăng tải và chia sẻ những khoảnh khắc đáng nhớ của bạn"
  },
  {
    icon: <MessageCircle size={32} color="#8B4513" />,
    title: "Trò chuyện",
    description: "Kết nối và trò chuyện với bạn bè mọi lúc mọi nơi"
  },
  {
    icon: <Heart size={32} color="#8B4513" />,
    title: "Tương tác",
    description: "Thể hiện cảm xúc với nội dung bạn yêu thích"
  },
  {
    icon: <Users size={32} color="#8B4513" />,
    title: "Cộng đồng",
    description: "Tham gia vào cộng đồng với những người có cùng sở thích"
  }
];

export default function Features() {
  return (
    <View className="flex-1 bg-[#F5F5F0]">
      <View className="flex-1 px-8 pt-12">
        <Text className="text-2xl font-bold text-[#2F1810] mb-8">
          Khám phá tính năng
        </Text>

        <FlatList
          data={features}
          keyExtractor={(item) => item.title}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInRight.delay(index * 200).duration(1000)}
              className="flex-row items-center bg-white p-4 rounded-xl mb-4 border border-[#D2B48C]"
            >
              <View className="bg-[#F5F5F0] p-3 rounded-full mr-4">
                {item.icon}
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-[#2F1810] mb-1">
                  {item.title}
                </Text>
                <Text className="text-[#8B7355]">
                  {item.description}
                </Text>
              </View>
            </Animated.View>
          )}
          className="flex-1 mb-8"
        />

        <TouchableOpacity
          onPress={() => router.push("/start")}
          className="bg-[#8B4513] w-full p-4 rounded-xl active:bg-[#6B3410] mb-8"
          style={{
            shadowColor: '#2F1810',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text className="text-[#F5F5F0] text-center text-lg font-medium">
            Tiếp tục
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}