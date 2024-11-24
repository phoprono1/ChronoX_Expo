import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router"; // Sử dụng useRouter thay vì useNavigation
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  checkGoogleAccount,
  createGoogleUser,
  createUser,
  getTargetId,
  signInGoogleUser,
  signInUser,
  updateAvatar,
  updateUserTargetId,
} from "@/constants/AppwriteUser";
import Icon from "react-native-vector-icons/FontAwesome"; // Import biểu tượng
import { account } from "@/constants/AppwriteClient";
import { registerForPushNotificationsAsync } from "@/services/NotificationService";
import { ID, OAuthProvider } from "react-native-appwrite";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { config } from "@/constants/Config";
import { Client, Account } from "appwrite";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false); // Thêm state loading
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Loading riêng cho Google

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: config.googleClientId,
    });
  }, []);

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
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setIsLoading(true);

    try {
      // Đăng nhập user
      const { jwt, userId } = await signInUser(email, password);
      await AsyncStorage.setItem("token", jwt);
      console.log("jwt", jwt);

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
            account.createPushTarget(
              ID.unique(),
              token,
              "67234ed10018e2ea077b"
            );
          } else {
            account.createPushTarget(
              ID.unique(),
              token,
              "67234ed10018e2ea077b"
            );
            console.log("Push target created", token);
          }
          // Lấy và cập nhật target ID
          const targets = await getTargetId(userId);
          console.log("targets ở đây nè", targets);
          const pushTarget = targets.find(
            (target) => target.providerType === "push"
          );

          console.log("pushTarget", pushTarget);

          if (pushTarget) {
            await updateUserTargetId(userId, pushTarget.$id);
            await AsyncStorage.setItem("targetId", pushTarget.$id);
          }
        } catch (error: any) {
          console.error("Error managing push target:", error.message);
        }
      } else {
        console.warn("No FCM token available");
      }

      router.replace("/(drawer)/(tabs)/home");
    } catch (error: any) {
      Alert.alert(
        "Lỗi đăng nhập",
        error.message || "Có lỗi xảy ra khi đăng nhập"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Thay thế hàm handleGoogleSignIn
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      await GoogleSignin.signOut();

      const userInfo = await GoogleSignin.signIn();
      console.log("Google Sign In Success:", userInfo);

      if (!userInfo.data?.user) {
        throw new Error("No user info found");
      }

      const { email, name, photo } = userInfo.data.user;

      try {
        // Kiểm tra tài khoản tồn tại
        const { exists, isGoogleAccount } = await checkGoogleAccount(email);

        if (exists) {
          if (!isGoogleAccount) {
            // Email đã được đăng ký với phương thức khác
            Alert.alert(
              "Lỗi đăng nhập",
              "Email này đã được đăng ký với phương thức khác"
            );
            return;
          }

          // Đăng nhập nếu là tài khoản Google
          const { jwt, userId } = await signInGoogleUser(email);
          await AsyncStorage.setItem("token", jwt);
          router.replace("/(drawer)/(tabs)/home");
        } else {
          // Tạo tài khoản mới nếu chưa tồn tại
          await createGoogleUser(name || "", email, email, photo || "");

          const { jwt, userId } = await signInGoogleUser(email);
          await AsyncStorage.setItem("token", jwt);

          if (photo) {
            await updateAvatar(photo);
          }

          router.replace("/(drawer)/(tabs)/home");
        }
      } catch (error: any) {
        console.error("Error:", error);
        Alert.alert(
          "Lỗi",
          error.message || "Có lỗi xảy ra khi đăng nhập với Google"
        );
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled the sign-in flow");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Sign in is in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("Play services not available");
      } else {
        console.error("Google sign in failed:", error);
      }
    } finally {
      setIsGoogleLoading(false);
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
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#F5F5F0" />
            ) : (
              <Text className="text-[#F5F5F0] text-center font-semibold">
                Đăng Nhập
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center my-4">
            <View className="flex-1 h-[1px] bg-[#D2B48C]" />
            <Text className="mx-4 text-[#8B7355]">hoặc</Text>
            <View className="flex-1 h-[1px] bg-[#D2B48C]" />
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-center bg-white p-4 rounded-md w-full mb-4 border border-[#D2B48C]"
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#8B4513" />
            ) : (
              <>
                <Icon
                  name="google"
                  size={20}
                  color="#8B4513"
                  style={{ marginRight: 10 }}
                />
                <Text className="text-[#2F1810] font-semibold">
                  Đăng nhập với Google
                </Text>
              </>
            )}
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
