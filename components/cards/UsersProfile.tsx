import React, { useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { avatars, client } from "@/constants/AppwriteClient";
import { useSelector } from "react-redux";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { config } from "@/constants/Config";
import { getAvatarUrl } from "@/constants/AppwriteFile";
import { FontAwesome } from "@expo/vector-icons";

const UsersProfile = () => {
  const userInfo = useSelector((state: any) => state.userInfo); // Lấy trạng thái người dùng từ Redux
  const isMinimized = useSelector(
    (state: any) => state.minimizeUsersInfo.isMinimized
  ); // Lấy trạng thái isMinimized từ Redux

  const [followerCount, setFollowerCount] = useState(userInfo.follower); // Thêm state cho số lượng follower

  const { width, height } = Dimensions.get("window");

  const fullContainerHeight = height * 0.4;
  const minimizedHeight = height * 0.12; // Giữ nguyên chiều cao khi thu nhỏ

  // Cập nhật followerCount khi userInfo thay đổi
  useEffect(() => {
    setFollowerCount(userInfo.follower);
  }, [userInfo.follower]);

  // Khởi tạo giá trị cho scale và position
  const avatarScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const followScale = useSharedValue(1);
  const contentOpacity = useSharedValue(1);
  const containerHeight = useSharedValue(fullContainerHeight);

  // Thêm các shared values mới cho text container
  const textTranslateX = useSharedValue(0);
  const textTranslateY = useSharedValue(0);

  // Calculate center position
  const centerX = width / 2 - 64; // 64 is half of avatar width (128px)
  const initialY = 16; // Initial padding from top

  useEffect(() => {
    // Cập nhật scale và position khi isMinimized thay đổi
    if (isMinimized) {
      // Di chuyển text container lên cạnh avatar
      textTranslateX.value = withSpring(width * 0.4); // Điều chỉnh khoảng cách từ avatar (20% chiều rộng màn hình)
      textTranslateY.value = withSpring(-height * 0.12); // Điều chỉnh độ cao để căn giữa với avatar (5% chiều cao màn hình)
      // Move to top-left corner
      translateX.value = withSpring(-centerX + width * 0.04); // 4% padding from left
      translateY.value = withSpring(-initialY + height * 0.004); // 4% padding from top
      avatarScale.value = withSpring(0.5);
      followScale.value = withTiming(0, { duration: 100 });
      contentOpacity.value = withTiming(1, { duration: 100 });
      containerHeight.value = withTiming(minimizedHeight); // Minimized height (adjust based on your needs)
    } else {
      // Trả text container về vị trí ban đầu
      textTranslateX.value = withSpring(0);
      textTranslateY.value = withSpring(0);
      // Move back to center
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      avatarScale.value = withSpring(1);
      followScale.value = withTiming(1, { duration: 100 });
      contentOpacity.value = withTiming(1, { duration: 100 });
      containerHeight.value = withTiming(fullContainerHeight); // Original height
    }
  }, [isMinimized]);

  // Animated styles for container
  const animatedAvatarContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: avatarScale.value },
      ],
      alignSelf: "center",
    };
  });

  const animatedFollowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: followScale.value }],
      opacity: followScale.value, // Thêm opacity để ẩn mượt mà
    };
  });

  // Cập nhật animatedContentStyle
  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [
        { translateX: textTranslateX.value },
        { translateY: textTranslateY.value },
      ],
      alignItems: isMinimized ? "flex-start" : "center",
      marginTop: isMinimized ? 0 : 16,
    };
  });

  // Stats container animated style
  const animatedStatsStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: followScale.value }],
      opacity: followScale.value,
      flexDirection: "row",
      justifyContent: "center",
      width: "100%",
      marginTop: 16,
    };
  });

  // Add container animated style
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      height: containerHeight.value,
      overflow: "hidden",
    };
  });

  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.userCollectionId}.documents`,
      async (response) => {
        const payload = JSON.parse(JSON.stringify(response.payload));
        if (userInfo.$id == payload.$id) {
          setFollowerCount(payload.follower); // Cập nhật state với số lượng follower mới
        }
      }
    );

    return () => {
      unsubscribe(); // Hủy đăng ký khi component unmount
    };
  }, []);

  return (
    <SafeAreaView className={`bg-white`}>
      <Animated.View
        style={[animatedContainerStyle]}
        className="relative w-full "
      >
        <Animated.View style={animatedAvatarContainerStyle}>
          <TouchableOpacity onPress={() => {}}>
            <Animated.Image
              source={{
                uri: userInfo.avatar
                  ? getAvatarUrl(userInfo.avatar)
                  : String(avatars.getInitials(userInfo.name, 30, 30)), // Sử dụng getFileUrl để lấy URL của avatar
              }}
              className="w-32 h-32 rounded-full border-4 border-gray-300"
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[animatedContentStyle]}>
          <Text className={`font-bold text-2xl`}>{userInfo.name}</Text>
          <Text className={`text-gray-500 text-sm `}>{userInfo.email}</Text>
        </Animated.View>

        <Animated.View
          style={animatedStatsStyle}
          className={`${
            isMinimized ? "hidden" : "flex flex-row justify-center w-full"
          }`}
        >
          <View className="flex-1 items-center">
            <Text className="font-bold">{userInfo.followed}</Text>
            <Text className="text-gray-500 text-sm">Đã follow</Text>
          </View>

          <View className="flex-1 items-center">
            <Text className="font-bold">{userInfo.follower}</Text>
            <Text className="text-gray-500 text-sm">Follower</Text>
          </View>

          <View className="flex-1 items-center">
            <Text className="font-bold">{userInfo.postsCount}</Text>
            <Text className="text-gray-500 text-sm">Bài viết</Text>
          </View>
        </Animated.View>
        <Animated.View style={[animatedContentStyle]}>
          <Text
            className={`text-gray-600 text-sm ${
              isMinimized ? "hidden" : "font-semibold"
            }`}
          >
            {userInfo.bio || "Chưa cập nhật tiểu sử"}
          </Text>
          <View className={`flex-row items-center ${isMinimized ? "hidden" : ""}`}>
            {!isMinimized && (
              <FontAwesome name="map-marker" size={24} color="black" />
            )}
            <Text className={`text-gray-600 text-sm ml-2`}>
              {userInfo.location || "Chưa cập nhật vị trí"}
            </Text>
          </View>
          <View className={`flex-row items-center ${isMinimized ? "hidden" : ""}`}>
            {!isMinimized && (
              <FontAwesome name="globe" size={24} color="black" />
            )}
            <Text className={`text-gray-600 text-sm ml-2`}>
              {userInfo.website || "Chưa cập nhật website"}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default UsersProfile;
