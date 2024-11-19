import { View, Text, Image, Dimensions } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { TouchableOpacity } from "react-native-gesture-handler";

const { width } = Dimensions.get("window");

export default function Welcome() {
  return (
    <View className="flex-1 bg-[#F5F5F0]">
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 items-center justify-center px-8"
      >
        <Image
          source={require("@/assets/images/welcome.png")} // Thêm hình ảnh welcome vào assets
          style={{ width: width * 0.8, height: width * 0.8 }}
          resizeMode="contain"
        />
        
        <Text className="text-3xl font-bold text-center text-[#2F1810] mt-8 mb-4">
          Chào mừng đến với ChronoX
        </Text>
        
        <Text className="text-base text-[#8B7355] text-center mb-8">
          Khám phá, chia sẻ và kết nối với cộng đồng thông qua những khoảnh khắc đáng nhớ
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/(welcome)/features")}
          className="bg-[#8B4513] w-full p-4 rounded-xl active:bg-[#6B3410]"
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
      </Animated.View>
    </View>
  );
}