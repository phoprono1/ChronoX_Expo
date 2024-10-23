import { account } from "@/constants/AppwriteClient";
import { Stack } from "expo-router/stack";
import { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Provider } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import store from "@/store/store";
import { router } from "expo-router";
import { BottomSheetProvider } from "@/hooks/BottomSheetProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from "@expo/vector-icons";
import { size } from "lodash";


export default function Layout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userID, setUserID] = useState<string | null>(null);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const user = await account.get();
          setUserID(user.$id);
          setIsLoggedIn(true);
          console.log("Đã đăng nhập", user.$id);
        } else {
          setIsLoggedIn(false);
          console.log("chưa đăng nhập");
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái đăng nhập:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserSession();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isLoggedIn) {
        router.replace("/(tabs)/home"); // Điều hướng đến (tabs) nếu đã đăng nhập
      } else {
        router.replace("/(auth)/SignIn"); // Chuyển hướng đến trang đăng nhập nếu chưa đăng nhập
      }
    }
  }, [isLoading, isLoggedIn]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <BottomSheetProvider>
        <Stack>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(functions)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="_sitemap" />
        </Stack>
      </BottomSheetProvider>
    </Provider>
  );
}