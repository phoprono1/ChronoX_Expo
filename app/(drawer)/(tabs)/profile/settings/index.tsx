import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ChevronRight,
  Lock,
  Shield,
  FileText,
  Info,
  LogOut,
} from "lucide-react-native";
import { Href, router } from "expo-router";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOutUser, updateUserStatus } from "@/constants/AppwriteUser";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const user = useSelector((state: RootState) => state.user);
  const currentUserId = user.userId;
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("targetId");
      await signOutUser();
      await updateUserStatus(currentUserId!!, 'offline');
      router.replace("/(auth)/SignIn");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        onPress: handleLogout,
        style: "destructive",
      },
    ]);
  };

  const settingsOptions = [
    {
      id: "password",
      title: "Cập nhật mật khẩu",
      icon: Lock,
      route: "(drawer)/(tabs)/profile/settings/password",
      description: "Thay đổi mật khẩu đăng nhập",
    },
    {
      id: "verification",
      title: "Xác thực tài khoản",
      icon: Shield,
      route: "(drawer)/(tabs)/profile/settings/verification",
      description: "Bảo mật tài khoản của bạn",
    },
    {
      id: "terms",
      title: "Điều khoản sử dụng",
      icon: FileText,
      route: "(drawer)/(tabs)/profile/settings/terms",
      description: "Chính sách và điều khoản",
    },
    {
      id: "about",
      title: "Thông tin ứng dụng",
      icon: Info,
      route: "(drawer)/(tabs)/profile/settings/about",
      description: "Phiên bản và thông tin khác",
    },
  ];

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
          Cài đặt
        </Text>
      </View>

      {/* Settings Options */}
      <ScrollView className="flex-1">
        <View className="p-4 space-y-3">
          {settingsOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => router.push(option.route as Href<string>)}
              className="bg-white rounded-xl p-4 flex-row items-center border border-[#D2B48C] active:bg-[#D2B48C]/10"
              style={{
                shadowColor: "#2F1810",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              {/* Icon */}
              <View className="w-10 h-10 bg-[#F5F5F0] rounded-full items-center justify-center">
                <option.icon size={20} color="#8B4513" />
              </View>

              {/* Text */}
              <View className="flex-1 ml-3">
                <Text className="text-[#2F1810] font-medium text-base">
                  {option.title}
                </Text>
                <Text className="text-[#8B7355] text-sm mt-0.5">
                  {option.description}
                </Text>
              </View>

              {/* Arrow */}
              <ChevronRight size={20} color="#8B7355" />
            </TouchableOpacity>
          ))}
        </View>

        <View className="px-8 pb-6">
          <TouchableOpacity
            onPress={confirmLogout}
            disabled={isLoading}
            className={`bg-[#8B4513] rounded-lg py-3 flex-row items-center justify-center space-x-2 
        ${isLoading ? "opacity-50" : ""} 
        active:bg-[#2F1810]`}
            style={{
              shadowColor: "#2F1810",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <LogOut size={18} color="#F5F5F0" />
            <Text className="text-[#F5F5F0] font-medium">Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
