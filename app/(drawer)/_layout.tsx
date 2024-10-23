import { Drawer } from "expo-router/drawer";
import { Href, router, Tabs, usePathname } from "expo-router";
import { Ionicons, FontAwesome, EvilIcons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text } from "react-native";
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

type DrawerItemType = {
  icon: typeof FontAwesome | typeof Ionicons;
  name: string;
  label: string;
  route: string;
  iconType: 'FontAwesome' | 'Ionicons';
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
      router.replace("/(auth)/SignIn");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  const drawerItems: DrawerItemType[] = [
    {
      icon: FontAwesome,
      name: "home",
      label: "Home",
      route: "/(drawer)/(tabs)/home",
      iconType: "FontAwesome"
    },
    {
      icon: FontAwesome,
      name: "search",
      label: "Search",
      route: "/(drawer)/(tabs)/search",
      iconType: "FontAwesome"
    },
    {
      icon: Ionicons,
      name: "chatbubble-ellipses",
      label: "Message",
      route: "/(drawer)/(tabs)/message",
      iconType: "Ionicons"
    },
    {
      icon: FontAwesome,
      name: "user",
      label: "Profile",
      route: "/(drawer)/(tabs)/profile",
      iconType: "FontAwesome"
    },
  ];

  const CustomDrawerContent = (props: any) => {
    const isActiveRoute = (route: string) => {
      return pathName.includes(route.split("/").pop() || "");
    };

    const renderIcon = (item: DrawerItemType) => {
      const color = isActiveRoute(item.route) ? "#ffffff" : "#000000";
      
      if (item.iconType === "FontAwesome") {
        return (
          <FontAwesome
            name={item.name as any}
            size={24}
            color={color}
          />
        );
      } else {
        return (
          <Ionicons
            name={item.name as any}
            size={24}
            color={color}
          />
        );
      }
    };

    return (
      <View className="flex-1">
        <DrawerContentScrollView {...props} className="flex-1 pt-5">
          {drawerItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className={`flex-row items-center mx-2 my-1 px-4 py-3 rounded-lg ${
                isActiveRoute(item.route)
                  ? "bg-blue-500"
                  : "bg-transparent"
              }`}
              onPress={() => router.push(item.route as Href)}
            >
              {renderIcon(item)}
              <Text
                className={`ml-4 font-medium ${
                  isActiveRoute(item.route)
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </DrawerContentScrollView>
        
        <TouchableOpacity 
          onPress={handleSignOut}
          className="flex-row items-center mx-2 mb-8 px-4 py-3 border-t border-gray-200"
        >
          <FontAwesome 
            name="sign-out" 
            size={24} 
            color="#EF4444" 
          />
          <Text className="ml-4 font-medium text-red-500">
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    />
  );
}