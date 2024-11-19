import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View, Image } from "react-native";
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
import { getAvatarUrl } from "@/constants/AppwriteFile";

import {
  Menu as MenuIcon,
  MapPin,
  Link as LinkIcon,
} from "lucide-react-native";
import { router } from "expo-router";

const DisplayAvatar = () => {
  const user = useSelector((state: any) => state.user); // Lấy trạng thái người dùng từ Redux
  const [showMenu, setShowMenu] = useState(false);

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

  // Thêm component Menu
  const MenuDropdown = () => {
    if (!showMenu) return null;

    return (
      <View
        className="absolute right-4 top-14 bg-white rounded-xl shadow-lg border border-[#D2B48C] z-50"
        style={{
          shadowColor: "#2F1810",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-[#D2B48C]"
          onPress={() => {
            setShowMenu(false);
            router.push("/(drawer)/(tabs)/profile/edit");
          }}
        >
          <Text className="text-[#2F1810] text-base">Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center px-4 py-3"
          onPress={() => {
            setShowMenu(false);
            router.push("/(drawer)/(tabs)/profile/settings");
          }}
        >
          <Text className="text-[#2F1810] text-base">Cài đặt</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Thêm hàm đóng menu khi click ra ngoài
  const handlePressOutside = () => {
    if (showMenu) {
      setShowMenu(false);
    }
  };

  return (
    <View className="bg-[#F5F5F0]">
      {showMenu && (
        <TouchableOpacity
          className="absolute inset-0 z-40"
          onPress={handlePressOutside}
        />
      )}
      {/* Header */}
      <View className="px-4 py-3 flex-row justify-between items-center border-b border-[#D2B48C]">
        <Text className="text-xl text-[#2F1810] font-medium">Hồ sơ</Text>
        <TouchableOpacity
          className="w-10 h-10 items-center justify-center rounded-full active:bg-[#D2B48C]/20"
          onPress={() => setShowMenu(!showMenu)}
        >
          <MenuIcon size={24} color="#8B4513" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <MenuDropdown />

      <View className="px-4 pt-4 pb-2">
        {/* Avatar và Thông tin cơ bản */}
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className="text-2xl text-[#2F1810] font-medium mb-1">
              {userInfo.name}
            </Text>
            <Text className="text-base text-[#8B7355]">{userInfo.email}</Text>
          </View>
          <TouchableOpacity
            onPress={handleChangeAvatar}
            className="p-[2px] rounded-full border border-[#D2B48C]"
          >
            <Image
              source={{
                uri: userInfo.avatarId
                  ? getAvatarUrl(userInfo.avatarId)
                  : String(avatars.getInitials(userInfo.name, 30, 30)),
              }}
              className="w-20 h-20 rounded-full"
            />
          </TouchableOpacity>
        </View>

        {/* Bio */}
        {userInfo.bio && (
          <Text className="text-base text-[#2F1810] mb-4 leading-5">
            {userInfo.bio}
          </Text>
        )}

        {/* Thống kê */}
        <View className="flex-row items-center space-x-6 mb-4">
          <View className="items-center">
            <Text className="text-lg font-medium text-[#2F1810]">
              {userInfo.postsCount}
            </Text>
            <Text className="text-[#8B7355]">Bài viết</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-medium text-[#2F1810]">
              {userInfo.follower}
            </Text>
            <Text className="text-[#8B7355]">Người theo dõi</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-medium text-[#2F1810]">
              {userInfo.followed}
            </Text>
            <Text className="text-[#8B7355]">Đang theo dõi</Text>
          </View>
        </View>

        {/* Location và Website */}
        {(userInfo.location || userInfo.website) && (
          <View className="space-y-2 mb-2">
            {userInfo.location && (
              <View className="flex-row items-center">
                <MapPin size={16} color="#8B4513" strokeWidth={1.5} />
                <Text className="text-[#8B7355] ml-2">{userInfo.location}</Text>
              </View>
            )}
            {userInfo.website && (
              <View className="flex-row items-center">
                <LinkIcon size={16} color="#8B4513" strokeWidth={1.5} />
                <Text className="text-[#8B7355] ml-2">{userInfo.website}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default DisplayAvatar;
