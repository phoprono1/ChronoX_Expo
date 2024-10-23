import { account } from "@/constants/AppwriteClient";
import { getAvatarUrl } from "@/constants/AppwriteFile";
import { getUserPostsCount } from "@/constants/AppwritePost";
import { getUserById, updateUserStatus } from "@/constants/AppwriteUser";
import { Colors } from "@/constants/Colors";
import { setUser } from "@/store/currentUser";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { Stack, useNavigation } from "expo-router";
import { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { Avatar } from "react-native-ui-lib";
import { useDispatch, useSelector } from "react-redux";

export default function HomeStack() {
  const dispatch = useDispatch();

  const currentUserId = useSelector((state: any) => state.currentUser.$id); // Thay đổi theo cấu trúc state của bạn
  const currentUser = useSelector((state: any) => state.currentUser);

  const loadCurrentUserId = async () => {
    if (currentUserId) {
      await updateUserStatus(currentUserId, "online");
    } else {
      try {
        const currentAccount = await account.get();
        // Lấy thông tin người dùng đầy đủ
        const userDocument = await getUserById(currentAccount.$id);
        const userInfo = {
          $id: userDocument.$id,
          userId: userDocument.accountID,
          email: userDocument.email,
          avatarId: userDocument.avatarId,
          name: userDocument.username,
          bio: userDocument.bio || "",
          followed: userDocument.followed || 0,
          follower: userDocument.follower || 0,
          location: userDocument.location || null,
          website: userDocument.website || null,
          postsCount: await getUserPostsCount(userDocument.$id), // Thêm postsCount nếu cần
        };
        // Cập nhật Redux store nếu cần
        dispatch(setUser(userInfo)); // Cập nhật userId và các thông tin khác vào Redux
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    }
  };

  useEffect(() => {
    loadCurrentUserId(); // Gọi hàm để lấy ID người dùng hiện tại
  }, []);

  const handleNotificationPress = () => {
    // Xử lý khi nhấn vào biểu tượng chuông
    console.log("Notification icon pressed");
    // Thêm logic điều hướng hoặc hiển thị thông báo ở đây
  };

  const navigation = useNavigation();

  const handleDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer);
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Home",
          headerShadowVisible: false,
          headerTintColor: "#0000ff",
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleDrawer}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="menu-sharp" size={24} color="#0000ff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleNotificationPress}
              style={{ marginRight: 15 }}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#0000ff"
              />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
