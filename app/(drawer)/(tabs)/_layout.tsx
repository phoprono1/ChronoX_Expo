import { account, databases } from '@/constants/AppwriteClient';
import { getUserPostsCount } from '@/constants/AppwritePost';
import { getCurrentUserId, updateUserStatus } from '@/constants/AppwriteUser';
import { config } from '@/constants/Config';
import { useBottomSheet } from '@/hooks/BottomSheetProvider';
import { setUser } from '@/store/currentUser';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, Tabs } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, TouchableOpacity } from 'react-native';
import { Query } from 'react-native-appwrite';
import { useDispatch } from 'react-redux';

export default function TabLayout() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const dispatch = useDispatch();
  const appState = useRef(AppState.currentState);
  const bottomSheet = useBottomSheet();
  const openBottomSheet = bottomSheet ? bottomSheet.openBottomSheet : () => {};
  const loadCurrentUserId = async () => {
    try {
      const currentAccount = await account.get();
      const currentUserId = await getCurrentUserId(currentAccount.$id);
      setCurrentUserId(currentUserId);
      await updateUserOnlineStatus("online");
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
    }
  };

  const updateUserOnlineStatus = async (status: "online" | "offline") => {
    if (currentUserId) {
      try {
        await updateUserStatus(currentUserId, status);
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái người dùng:", error);
      }
    }
  };

  useEffect(() => {
    loadCurrentUserId(); // Gọi hàm để lấy ID người dùng hiện tại
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentAccount = await account.get();
        const userDocuments = await databases.listDocuments(
          config.databaseId,
          config.userCollectionId,
          [Query.equal("accountID", currentAccount.$id)]
        );

        if (userDocuments.documents.length > 0) {
          const userDocument = userDocuments.documents[0];
          const userInfo = {
            $id: userDocument.$id,
            userId: userDocument.accountID,
            email: userDocument.email,
            avatarId: userDocument.avatarId,
            name: userDocument.username, // Thêm name
            bio: userDocument.bio || "", // Thêm bio
            followed: userDocument.followed || 0, // Thêm followed
            follower: userDocument.follower || 0, // Thêm follower
            location: userDocument.location || null, // Thêm location
            website: userDocument.website || null, // Thêm website
            postsCount: await getUserPostsCount(userDocument.$id), // Thêm postsCount
          };
          dispatch(setUser(userInfo)); // Cập nhật thông tin người dùng vào Redux
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    };

    fetchUserData();
  }, [dispatch]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        updateUserOnlineStatus("online");
      } else if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        updateUserOnlineStatus("offline");
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [currentUserId]);

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="search" color={color} />, // Đổi thành biểu tượng tìm kiếm
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarButton: () => (
            <TouchableOpacity
              onPress={() => openBottomSheet('createPost')}
              style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} // Đảm bảo tab có cùng kích thước
            >
              <FontAwesome size={40} name="plus-circle"/>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="message"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses" size={28} color={color} />, // Đổi thành biểu tượng tin nhắn
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />, // Đổi thành biểu tượng người dùng
        }}
      />
    </Tabs>
  );
}
