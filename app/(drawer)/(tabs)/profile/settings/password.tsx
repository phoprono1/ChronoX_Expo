import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react-native";
import { router } from "expo-router";
import { useState } from "react";
import { updateUserPassword } from "@/constants/AppwriteUser";

const Password = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdatePassword = async () => {
    try {
      // Validation
      if (!oldPassword || !newPassword || !confirmPassword) {
        Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
        return;
      }
  
      if (newPassword !== confirmPassword) {
        Alert.alert("Lỗi", "Mật khẩu mới không khớp");
        return;
      }
  
      if (newPassword.length < 8) {
        Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 8 ký tự");
        return;
      }
  
      if (oldPassword === newPassword) {
        Alert.alert("Lỗi", "Mật khẩu mới không được trùng với mật khẩu hiện tại");
        return;
      }
  
      setIsLoading(true);
      try {
        await updateUserPassword(oldPassword, newPassword);
        Alert.alert("Thành công", "Đổi mật khẩu thành công");
        router.back();
      } catch (error: any) {
        if (error.message?.includes("Invalid credentials")) {
          Alert.alert("Lỗi", "Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại.");
        } else {
          Alert.alert("Lỗi", "Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại sau.");
        }
        console.log("Password update error:", error);
      }
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
          Đổi mật khẩu
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 p-4">
        <View className="bg-white rounded-xl p-6 border border-[#D2B48C]">
          {/* Old Password */}
          <View className="mb-4">
            <Text className="text-[#2F1810] font-medium mb-2">Mật khẩu hiện tại</Text>
            <View className="flex-row items-center border border-[#D2B48C] rounded-lg bg-white">
              <Lock size={20} color="#8B4513" className="ml-3" />
              <TextInput
                className="flex-1 p-3 text-[#2F1810]"
                secureTextEntry={!showOldPassword}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor="#8B7355"
              />
              <TouchableOpacity
                onPress={() => setShowOldPassword(!showOldPassword)}
                className="px-3"
              >
                {showOldPassword ? (
                  <EyeOff size={20} color="#8B4513" />
                ) : (
                  <Eye size={20} color="#8B4513" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View className="mb-4">
            <Text className="text-[#2F1810] font-medium mb-2">Mật khẩu mới</Text>
            <View className="flex-row items-center border border-[#D2B48C] rounded-lg bg-white">
              <Lock size={20} color="#8B4513" className="ml-3" />
              <TextInput
                className="flex-1 p-3 text-[#2F1810]"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor="#8B7355"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                className="px-3"
              >
                {showNewPassword ? (
                  <EyeOff size={20} color="#8B4513" />
                ) : (
                  <Eye size={20} color="#8B4513" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
            <Text className="text-[#2F1810] font-medium mb-2">Xác nhận mật khẩu mới</Text>
            <View className="flex-row items-center border border-[#D2B48C] rounded-lg bg-white">
              <Lock size={20} color="#8B4513" className="ml-3" />
              <TextInput
                className="flex-1 p-3 text-[#2F1810]"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor="#8B7355"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="px-3"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#8B4513" />
                ) : (
                  <Eye size={20} color="#8B4513" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Update Button */}
          <TouchableOpacity
            onPress={handleUpdatePassword}
            disabled={isLoading}
            className={`bg-[#8B4513] py-3 rounded-lg items-center ${
              isLoading ? "opacity-50" : ""
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#F5F5F0" />
            ) : (
              <Text className="text-[#F5F5F0] font-medium">Cập nhật mật khẩu</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Password;