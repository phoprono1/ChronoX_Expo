import { View, Text, Image, Dimensions } from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { TouchableOpacity } from "react-native-gesture-handler";

const { width } = Dimensions.get("window");

export default function Start() {
  return (
    <View className="flex-1 bg-[#F5F5F0]">
      <Animated.View 
        entering={FadeIn.duration(1000)}
        className="flex-1 items-center justify-center px-8"
      >
        <Image
          source={require("@/assets/images/start.png")} // Thêm hình ảnh start vào assets
          style={{ width: width * 0.8, height: width * 0.8 }}
          resizeMode="contain"
        />

        <Animated.Text 
          entering={FadeInUp.delay(200).duration(1000)}
          className="text-3xl font-bold text-center text-[#2F1810] mt-8 mb-4"
        >
          Sẵn sàng khám phá?
        </Animated.Text>

        <Animated.Text 
          entering={FadeInUp.delay(400).duration(1000)}
          className="text-base text-[#8B7355] text-center mb-8"
        >
          Tham gia ngay để bắt đầu hành trình của bạn
        </Animated.Text>

        <View className="w-full gap-4">
          <TouchableOpacity
            onPress={() => router.push("/SignUp")}
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
              Đăng ký
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/SignIn")}
            className="bg-[#F5F5F0] w-full p-4 rounded-xl border border-[#8B4513]"
          >
            <Text className="text-[#8B4513] text-center text-lg font-medium">
              Đăng nhập
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}