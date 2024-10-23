import React, { useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  getUserById,
  getUserInfo,
  updateAvatar,
} from "@/constants/AppwriteUser";
import { avatars, client } from "@/constants/AppwriteClient";
import { fetchPostById, getUserPostsCount } from "@/constants/AppwritePost";
import { config } from "@/constants/Config";
import { useSelector } from "react-redux";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { getAvatarUrl } from "@/constants/AppwriteFile";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Ionicons } from "@expo/vector-icons";
const DisplayAvatar = () => {
  const user = useSelector((state: any) => state.user); // Lấy trạng thái người dùng từ Redux
  const isMinimized = useSelector((state: any) => state.minimize.isMinimized); // Lấy trạng thái isMinimized từ Redux
  const { width, height } = Dimensions.get("window");

  const fullContainerHeight = height * 0.42;
  const minimizedHeight = height * 0.12; // Giữ nguyên chiều cao khi thu nhỏ

  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    avatarId: string | null;
    bio: string; // Thêm bio
    followed: number; // Thêm followed
    follower: number; // Thêm follower
    location: string | null; // Thêm location
    website: string | null; // Thêm website
    postsCount: number; // Thêm postsCount
  }>({
    name: "",
    email: "",
    avatarId: null,
    bio: "",
    followed: 0,
    follower: 0,
    location: null,
    website: null,
    postsCount: 0, // Khởi tạo postsCount
  });

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

  const fetchUserInfo = async () => {
    // Định nghĩa lại hàm fetchUserInfo
    try {
      const userDocument = await getUserInfo(); // Gọi hàm getUserInfo từ appwriteConfig
      const postsCount = await getUserPostsCount(user.userId); // Gọi hàm getUserPostsCount từ appwriteConfig
      setUserInfo({
        name: userDocument.username,
        email: userDocument.email,
        avatarId: userDocument.avatarId,
        bio: userDocument.bio || "", // Lấy bio
        followed: userDocument.followed || 0, // Lấy followed
        follower: userDocument.follower || 0, // Lấy follower
        location: userDocument.location || null, // Lấy location
        website: userDocument.website || null, // Lấy website
        postsCount: postsCount, // Lấy số lượng bài viết
      });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
    }
  };

  useEffect(() => {
    fetchUserInfo(); // Gọi hàm fetchUserInfo khi component được mount
  }, [user]);

  useEffect(() => {
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

  const handleChangeAvatar = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Bạn cần cấp quyền truy cập vào thư viện ảnh!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync();

    if (!result.canceled) {
      const newAvatarUri = result.assets[0].uri; // Lấy uri mới

      // Kiểm tra định dạng của ảnh
      const isHEIF =
        newAvatarUri.endsWith(".heif") || newAvatarUri.endsWith(".heic");

      let finalUri = newAvatarUri;

      // Nếu ảnh là HEIF, có thể cần xoay
      if (isHEIF) {
        const manipResult = await ImageManipulator.manipulateAsync(
          newAvatarUri,
          [{ rotate: 90 }], // Xoay 90 độ nếu cần
          { compress: 1, format: ImageManipulator.SaveFormat.PNG }
        );
        finalUri = manipResult.uri; // Cập nhật uri nếu đã xoay
      }
      // Cập nhật avatar trong cơ sở dữ liệu bằng hàm updateAvatar
      try {
        const updatedAvatarId = await updateAvatar(finalUri); // Gọi hàm updateAvatar với uri mới và nhận về avatarId mới
        // Cập nhật avatarId cho user
        setUserInfo((prev) => ({ ...prev, avatarId: updatedAvatarId!! }));
        await fetchUserInfo(); // Gọi lại hàm fetchUserInfo để cập nhật thông tin người dùng
      } catch (error) {
        console.error("Lỗi khi cập nhật avatar:", error);
      }
    }
  };

  // Hàm use effect subcribe theo dõi sự kiện tạo bài viết mới
  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.postCollectionId}.documents`,
      async (response) => {
        const payload = JSON.parse(JSON.stringify(response.payload)); // Chuyển đổi payload về đối tượng

        const newPostId = payload.$id; // Lấy $id từ payload
        const newPost = await fetchPostById(newPostId); // Gọi hàm để lấy thông tin bài viết mới
        // Lấy thông tin người dùng từ accountID
        const userInfo = await getUserById(newPost.accountID.accountID); // Hàm này cần được tạo để lấy thông tin người dùng
        // Hàm load lại số lượng bài viết
        const postsCount = await getUserPostsCount(userInfo.$id);
        setUserInfo((prev) => ({ ...prev, postsCount: postsCount }));
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Hàm use effect subcribe theo dõi sự kiện thay đổi avatar
  useEffect(() => {
    const unsubscribeAvatar = client.subscribe(
      `databases.${config.databaseId}.collections.${config.userCollectionId}.documents`,
      async (response) => {
        const payload = JSON.parse(JSON.stringify(response.payload)); // Chuyển đổi payload về đối tượng

        // Cập nhật avatarId cho user
        if (payload.avatarId) {
          setUserInfo((prev) => ({ ...prev, avatarId: payload.avatarId }));
        }
      }
    );

    return () => {
      unsubscribeAvatar();
    };
  }, []);

  return (
    <SafeAreaView className={`bg-white`}>
      <Animated.View
        style={[animatedContainerStyle]}
        className="relative w-full"
      >
        <TouchableOpacity 
          className="absolute top-4 right-4 z-10"
          onPress={() => {
            // Xử lý sự kiện khi nhấn vào nút chỉnh sửa
            console.log("Chỉnh sửa trang cá nhân");
          }}
        >
          <Ionicons name="pencil" size={28} color="#0000ff" />
        </TouchableOpacity>
        <Animated.View style={animatedAvatarContainerStyle}>
          <TouchableOpacity onPress={handleChangeAvatar}>
            <Animated.Image
              source={{
                uri: userInfo.avatarId
                  ? getAvatarUrl(userInfo.avatarId)
                  : String(avatars.getInitials(userInfo.name, 30, 30)), // Sử dụng getFileUrl để lấy URL của avatar
              }}
              className="w-32 h-32 rounded-full border-2 border-gray-300"
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[animatedContentStyle]} className="flex">
          <Text className="font-bold text-xl">{user.name}</Text>
          <Text className="text-gray-500 text-sm">{user.email}</Text>
        </Animated.View>

        <Animated.View
          style={animatedStatsStyle}
          className={`${
            isMinimized ? "hidden" : "flex flex-row justify-center w-full"
          }`}
        >
          <View className="flex-1 items-center">
            <Text className="font-bold text-lg">{user.postsCount}</Text>
            <Text className="text-gray-500 text-xs">Bài viết</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="font-bold text-lg">{user.follower}</Text>
            <Text className="text-gray-500 text-xs">Người theo dõi</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="font-bold text-lg">{user.followed}</Text>
            <Text className="text-gray-500 text-xs">Đang theo dõi</Text>
          </View>
        </Animated.View>
        <Animated.View style={[animatedContentStyle]}>
          {user.bio && (
            <Text
              className={`text-gray-600 text-sm mb-4 ${
                isMinimized ? "hidden" : "font-semibold"
              }`}
            >
              "{user.bio}"
            </Text>
          )}
          <View className={`flex-row items-center mb-2`}>
            {user.location && (
              <>
                {isMinimized ? null : (
                  <Ionicons name="location-outline" size={16} color="gray" />
                )}
                <Text
                  className={`text-gray-600 text-sm ml-2 ${
                    isMinimized ? "hidden" : ""
                  }`}
                >
                  {user.location}
                </Text>
              </>
            )}
          </View>
          <View className={`flex-row items-center mb-4`}>
            {user.website && (
              <>
                {isMinimized ? null : (
                  <Ionicons name="globe-outline" size={16} color="gray" />
                )}
                <Text
                  className={`text-gray-600 text-sm ml-2 ${
                    isMinimized ? "hidden" : ""
                  }`}
                >
                  {user.website}
                </Text>
              </>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default DisplayAvatar;
