import { account } from "@/constants/AppwriteClient";
import { getAvatarUrl } from "@/constants/AppwriteFile";
import { getUserPostsCount } from "@/constants/AppwritePost";
import { getUserById, updateUserStatus } from "@/constants/AppwriteUser";
import { Colors } from "@/constants/Colors";
import { setUser } from "@/store/currentUser";
import { Stack } from "expo-router";
import { useEffect } from "react";
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

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Search",
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerTintColor: '#0000ff',
          headerSearchBarOptions: {
            placeholder: 'Tìm kiếm'
          }
        }}
      />
    </Stack>
  );
}
