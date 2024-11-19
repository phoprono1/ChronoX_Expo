import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Github, Mail, Globe, Phone } from "lucide-react-native";
import { router } from "expo-router";

const About = () => {
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F0]">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-[#D2B48C]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-[#D2B48C]/20"
        >
          <ArrowLeft size={24} color="#8B4513" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl text-[#2F1810] font-medium text-center mr-10">
          Về chúng tôi
        </Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-xl p-6 border border-[#D2B48C]">
          {/* App Info */}
          <View className="mb-8 items-center">
            {/* Thêm items-center */}
            <Image
              source={require("@/assets/images/CHRONOX.png")}
              className="w-20 h-20 mb-2 rounded-full"
            />
            <Text className="text-3xl font-bold text-[#8B4513] text-center mb-2">
              ChronoX
            </Text>
            <Text className="text-[#8B7355] text-center mb-4">
              Mạng xã hội cho người Việt
            </Text>
            <View className="flex-row justify-center space-x-4">
              <Text className="text-[#2F1810]">Phiên bản 1.0.0</Text>
              <Text className="text-[#2F1810]">•</Text>
              <Text className="text-[#2F1810]">20/03/2024</Text>
            </View>
          </View>

          {/* Company Info */}
          <View className="mb-8">
            <Text className="text-lg font-medium text-[#8B4513] mb-4">
              Thông tin công ty
            </Text>
            <Text className="text-[#2F1810] mb-2">ChronoX Technology JSC</Text>
            <Text className="text-[#2F1810] mb-2">MST: 0123456789</Text>
            <Text className="text-[#2F1810] mb-2">
              Địa chỉ: 470 Trần Đại Nghĩa, Ngũ Hành Sơn, Đà Nẵng
            </Text>
          </View>

          {/* Contact */}
          <View className="mb-8">
            <Text className="text-lg font-medium text-[#8B4513] mb-4">
              Liên hệ
            </Text>
            <TouchableOpacity
              onPress={() => openLink("mailto:contact@chronox.com")}
              className="flex-row items-center mb-3"
            >
              <Mail size={20} color="#8B4513" />
              <Text className="text-[#2F1810] ml-3">contact@chronox.com</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openLink("tel:+84123456789")}
              className="flex-row items-center mb-3"
            >
              <Phone size={20} color="#8B4513" />
              <Text className="text-[#2F1810] ml-3">0123 456 789</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openLink("https://chronox.com")}
              className="flex-row items-center mb-3"
            >
              <Globe size={20} color="#8B4513" />
              <Text className="text-[#2F1810] ml-3">www.chronox.com</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openLink("https://github.com/chronox")}
              className="flex-row items-center"
            >
              <Github size={20} color="#8B4513" />
              <Text className="text-[#2F1810] ml-3">github.com/chronox</Text>
            </TouchableOpacity>
          </View>

          {/* Tech Stack */}
          <View className="mb-8">
            <Text className="text-lg font-medium text-[#8B4513] mb-4">
              Công nghệ sử dụng
            </Text>
            <Text className="text-[#2F1810] mb-1">• React Native (Expo)</Text>
            <Text className="text-[#2F1810] mb-1">• TypeScript</Text>
            <Text className="text-[#2F1810] mb-1">• Appwrite</Text>
            <Text className="text-[#2F1810]">• TailwindCSS</Text>
          </View>

          {/* Copyright */}
          <View>
            <Text className="text-[#8B7355] text-center">
              © 2024 ChronoX. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default About;
