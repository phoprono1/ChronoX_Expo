import { View } from 'react-native';
import { account, databases } from '@/constants/AppwriteClient';
import { getUserPostsCount } from '@/constants/AppwritePost';
import { getCurrentUserId, updateUserStatus } from '@/constants/AppwriteUser';
import { config } from '@/constants/Config';
import { useBottomSheet } from '@/hooks/BottomSheetProvider';
import { setUser } from '@/store/currentUser';
import { Tabs } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, TouchableOpacity } from 'react-native';
import { Query } from 'react-native-appwrite';
import { useDispatch } from 'react-redux';

import { 
  Home,
  Search,
  PlusCircle,
  MessageCircle,
  User
} from 'lucide-react-native';

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
    <Tabs screenOptions={{
      lazy: true,
      tabBarStyle: {
        backgroundColor: '#F5F5F0', // Màu nền vintage
        borderTopWidth: 1,
        borderTopColor: '#D2B48C',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarActiveTintColor: '#8B4513', // Màu nâu đồng khi active
      tabBarInactiveTintColor: '#2F1810', // Màu nâu đậm khi không active
      tabBarHideOnKeyboard: true,
      tabBarLabelStyle: {
        fontFamily: 'PlayfairDisplay-Medium', // Thêm font nếu có
        fontSize: 12,
        marginTop: 0,
      },
      tabBarIconStyle: {
        marginTop: 3,
      }
    }}>
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-1 rounded-full ${focused ? 'bg-[#D2B48C]/20' : ''}`}>
              <Home size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          unmountOnBlur: true,
          headerShown: false,
          title: 'Tìm kiếm',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-1 rounded-full ${focused ? 'bg-[#D2B48C]/20' : ''}`}>
              <Search size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Đăng bài',
          tabBarButton: () => (
            <TouchableOpacity
              onPress={() => openBottomSheet('createPost')}
              className="flex-1 items-center justify-center -mt-5"
            >
              <View className="bg-[#8B4513] p-3 rounded-full border-4 border-[#F5F5F0]">
                <PlusCircle size={32} color="#F5F5F0" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="message"
        options={{
          unmountOnBlur: true,
          headerShown: false,
          title: 'Tin nhắn',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-1 rounded-full ${focused ? 'bg-[#D2B48C]/20' : ''}`}>
              <MessageCircle size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          unmountOnBlur: true,
          headerShown: false,
          title: 'Hồ sơ',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-1 rounded-full ${focused ? 'bg-[#D2B48C]/20' : ''}`}>
              <User size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}