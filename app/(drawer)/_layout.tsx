import { Drawer } from "expo-router/drawer";
import { Href, router, Tabs, usePathname } from "expo-router";
import { TouchableOpacity, View, Text, Image } from "react-native";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOutUser, updateUserStatus } from "@/constants/AppwriteUser";
import { account, databases } from "@/constants/AppwriteClient";
import { config } from "@/constants/Config";
import { Query } from "react-native-appwrite";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/userSlice";
import { getUserPostsCount } from "@/constants/AppwritePost";

import {
  Home,
  Search,
  MessageCircle,
  User,
  LogOut
} from 'lucide-react-native';

// Import thêm type từ lucide-react-native
import { LucideIcon } from 'lucide-react-native';

// Sửa lại type DrawerItemType
type DrawerItemType = {
  icon: LucideIcon;  // Thay đổi type của icon
  label: string;
  route: string;
};

export default function Layout() {
  const { openBottomSheet } = useBottomSheet();
  const pathName = usePathname();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const dispatch = useDispatch();

  
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
          setCurrentUserId(userDocument.$id);
          dispatch(setUser({ // Dispatch action để cập nhật trạng thái
            email: userDocument.email,
            userId: userDocument.$id,
            avatarId: userDocument.avatarId,
            name: userDocument.username, // Thêm name
            bio: userDocument.bio || "", // Thêm bio
            followed: userDocument.followed || 0, // Thêm followed
            follower: userDocument.follower || 0, // Thêm follower
            location: userDocument.location || null, // Thêm location
            website: userDocument.website || null, // Thêm website
            postsCount: await getUserPostsCount(userDocument.$id), // Thêm postsCount
          }));
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await signOutUser();
      await updateUserStatus(currentUserId!!, 'offline');
      router.replace("/(welcome)/");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  // Cập nhật danh sách drawer items
  const drawerItems: DrawerItemType[] = [
    {
      icon: Home,
      label: "Trang Chủ",
      route: "/(drawer)/(tabs)/home"
    },
    {
      icon: Search,
      label: "Tìm Kiếm",
      route: "/(drawer)/(tabs)/search"
    },
    {
      icon: MessageCircle,
      label: "Tin Nhắn",
      route: "/(drawer)/(tabs)/message"
    },
    {
      icon: User,
      label: "Hồ Sơ",
      route: "/(drawer)/(tabs)/profile"
    },
  ];

  const CustomDrawerContent = (props: any) => {
    const isActiveRoute = (route: string) => {
      return pathName.includes(route.split("/").pop() || "");
    };

    return (
      <View className="flex-1 bg-[#CEC6B5]">
        {/* Header của Drawer */}
        <View className="pt-12 pb-6 px-4 bg-[#8B4513] items-center justify-center">
          <Image 
            source={require('@/assets/images/CHRONOX.png')}
            className="w-32 h-32 rounded-full"
            resizeMode="contain"
          />
        </View>

        <DrawerContentScrollView 
          {...props} 
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 20
          }}
        >
          {drawerItems.map((item, index) => {
            const isActive = isActiveRoute(item.route);
            const IconComponent = item.icon;
            
            return (
              <TouchableOpacity
                key={index}
                className={`flex-row items-center mx-2 my-1 px-4 py-3 rounded-lg ${
                  isActive 
                    ? "bg-[#8B4513] border border-[#D2B48C]" 
                    : "bg-[#F5F5F0] border border-[#D2B48C]"
                }`}
                onPress={() => router.push(item.route as Href)}
              >
                <IconComponent 
                  size={24} 
                  color={isActive ? "#F5F5F0" : "#2F1810"} 
                />
                <Text
                  className={`ml-4 font-medium ${
                    isActive 
                      ? "text-[#F5F5F0]" 
                      : "text-[#2F1810]"
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </DrawerContentScrollView>
        
        {/* Nút Đăng xuất */}
        <TouchableOpacity 
          onPress={handleSignOut}
          className="flex-row items-center mx-2 mb-8 px-4 py-3 border-t border-[#D2B48C] mt-2"
        >
          <LogOut size={24} color="#8B4513" />
          <Text className="ml-4 font-medium text-[#8B4513]">
            Đăng Xuất
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#CEC6B5',
          width: 280,
        },
        sceneContainerStyle: {
          backgroundColor: '#CEC6B5'
        }
      }}
    />
  );
}