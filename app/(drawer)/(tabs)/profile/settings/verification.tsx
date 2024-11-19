import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ArrowLeft, Shield, Mail, CheckCircle2 } from "lucide-react-native";
import { router, usePathname } from "expo-router";
import { useState } from "react";
import { sendVerificationEmail } from "@/services/EmailService";

const Verification = () => {
  const user = useSelector((state: any) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  console.log('Current path:', pathname); // In ra đường dẫn

  const handleSendVerification = async () => {
    try {
      setIsLoading(true);

      const result = await sendVerificationEmail(
        user.userId,
        user.name,
        user.email
      );

      Alert.alert(
        "Thành công",
        "Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư của bạn."
      );
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi email xác thực. Vui lòng thử lại sau.");
      console.error("Send verification error:", error);
    } finally {
      setIsLoading(false);
    }
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
          Xác thực tài khoản
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 p-4">
        <View className="bg-white rounded-xl p-6 border border-[#D2B48C]">
          {user.emailVerification ? (
            // Đã xác thực
            <View className="items-center">
              <View className="w-16 h-16 bg-[#DFF2E5] rounded-full items-center justify-center mb-4">
                <CheckCircle2 size={32} color="#28A745" />
              </View>
              <Text className="text-[#2F1810] text-lg font-medium text-center mb-2">
                Tài khoản đã được xác thực
              </Text>
              <Text className="text-[#8B7355] text-center">
                Email của bạn đã được xác thực thành công
              </Text>
            </View>
          ) : (
            // Chưa xác thực
            <View className="items-center">
              <View className="w-16 h-16 bg-[#FFF3CD] rounded-full items-center justify-center mb-4">
                <Shield size={32} color="#8B4513" />
              </View>
              <Text className="text-[#2F1810] text-lg font-medium text-center mb-2">
                Xác thực tài khoản của bạn
              </Text>
              <Text className="text-[#8B7355] text-center mb-6">
                Tài khoản của bạn chưa được xác thực. Vui lòng xác thực để truy
                cập đầy đủ tính năng.
              </Text>
              <TouchableOpacity
                onPress={handleSendVerification}
                disabled={isLoading}
                className={`flex-row items-center justify-center bg-[#8B4513] px-6 py-3 rounded-xl ${
                  isLoading ? "opacity-50" : ""
                }`}
                style={{
                  shadowColor: "#2F1810",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Mail size={20} color="#F5F5F0" className="mr-2" />
                <Text className="text-[#F5F5F0] font-medium ml-2">
                  {isLoading ? "Đang gửi..." : "Gửi email xác thực"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Verification;
