import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Link, useRouter } from "expo-router"; // Sử dụng useRouter thay vì useNavigation
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInUser, updateUserTargetId } from "@/constants/AppwriteUser";
import Icon from "react-native-vector-icons/FontAwesome"; // Import biểu tượng
import { account } from "@/constants/AppwriteClient";
import { registerForPushNotificationsAsync } from "@/services/NotificationService";
import { ID } from "react-native-appwrite";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const router = useRouter();

  // Lấy FCM token khi component mount
  useEffect(() => {
    const getFCMToken = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setFcmToken(token);
        // Lưu token vào AsyncStorage để sử dụng sau này
        await AsyncStorage.setItem("fcmToken", token);
      }
    };

    getFCMToken();
  }, []);

  const handleSignIn = async () => {
    try {
      // Đăng nhập user
      const { jwt, userId } = await signInUser(email, password);
      await AsyncStorage.setItem("token", jwt);

      // Lấy FCM token hiện tại
      const token = fcmToken || (await AsyncStorage.getItem("fcmToken"));

      if (token) {
        try {
          // Kiểm tra các target hiện có
          const userAccount = await account.get();
          const existingPushTarget = userAccount.targets.find(
            (target: any) => target.providerType === "push"
          );

          if (existingPushTarget) {
            // Xóa push target cũ
            await account.deletePushTarget(existingPushTarget.$id);
          }

          // Tạo push target mới
          const targetId = ID.unique();
          await updateUserTargetId(userId, targetId);
          await AsyncStorage.setItem("targetId", targetId);
        } catch (error: any) {
          console.error("Error managing push target:", error.message);
        }
      } else {
        console.warn("No FCM token available");
      }

      router.replace("/(drawer)/(tabs)/home");
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-4 bg-[#CEC6B5]">
      <View className="flex-row items-center justify-center mt-20 mb-12 rounded-full">
        <Image
          source={require("@/assets/images/CHRONOX.png")}
          className="w-40 h-40"
          resizeMode="contain"
        />
      </View>

      <View className="w-full max-w-sm">
        <View className="bg-[#F5F5F0] p-6 rounded-lg shadow-md border border-[#D2B48C]">
          <Text className="text-2xl font-bold mb-6 text-[#2F1810] text-center">
            Đăng Nhập
          </Text>

          <View className="flex-row items-center border border-[#D2B48C] rounded-md mb-4 bg-white">
            <Icon
              name="envelope"
              size={20}
              color="#8B4513"
              style={{ margin: 10 }}
            />
            <TextInput
              placeholder="Email"
              className="flex-1 p-3 text-[#2F1810]"
              onChangeText={setEmail}
              autoCapitalize="none"
              placeholderTextColor="#8B7355"
            />
          </View>

          <View className="flex-row items-center border border-[#D2B48C] rounded-md mb-6 bg-white">
            <Icon
              name="lock"
              size={20}
              color="#8B4513"
              style={{ margin: 10 }}
            />
            <TextInput
              placeholder="Mật khẩu"
              secureTextEntry
              className="flex-1 p-3 text-[#2F1810]"
              onChangeText={setPassword}
              placeholderTextColor="#8B7355"
            />
          </View>

          <TouchableOpacity
            className="bg-[#8B4513] p-4 rounded-md w-full mb-4 border border-[#D2B48C]"
            onPress={handleSignIn}
          >
            <Text className="text-[#F5F5F0] text-center font-semibold">
              Đăng Nhập
            </Text>
          </TouchableOpacity>

          <Link href="/SignUp">
            <Text className="text-[#8B4513] text-center underline">
              Chưa có tài khoản? Đăng ký
            </Text>
          </Link>
        </View>
      </View>
    </View>
  );
}
