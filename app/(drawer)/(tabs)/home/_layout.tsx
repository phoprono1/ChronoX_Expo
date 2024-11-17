import { account } from "@/constants/AppwriteClient";
import { getAvatarUrl } from "@/constants/AppwriteFile";
import { getUserPostsCount } from "@/constants/AppwritePost";
import { getUserById, updateUserStatus } from "@/constants/AppwriteUser";
import { Colors } from "@/constants/Colors";
import { setUser } from "@/store/currentUser";
import { DrawerActions } from "@react-navigation/native";
import { Stack, useNavigation } from "expo-router";
import { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { Avatar } from "react-native-ui-lib";
import { useDispatch, useSelector } from "react-redux";
// Import icons từ lucide-react-native
import { Menu, Bell } from 'lucide-react-native';

export default function HomeStack() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const currentUserId = useSelector((state: any) => state.currentUser.$id);
  const currentUser = useSelector((state: any) => state.currentUser);

  const loadCurrentUserId = async () => {
    if (currentUserId) {
      await updateUserStatus(currentUserId, "online");
    } else {
      try {
        const currentAccount = await account.get();
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
          postsCount: await getUserPostsCount(userDocument.$id),
        };
        dispatch(setUser(userInfo));
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    }
  };

  useEffect(() => {
    loadCurrentUserId();
  }, []);

  const handleNotificationPress = () => {
    console.log("Notification icon pressed");
  };

  const handleDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer);
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "ChronoX",
          headerStyle: {
            backgroundColor: '#F5F5F0',
          },
          headerTitleStyle: {
            fontFamily: 'PlayfairDisplay-Bold',
            color: '#8B4513',
            fontSize: 24,
            fontWeight: 'bold',
          },
          headerShadowVisible: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleDrawer}
              className="ml-2"
            >
              <Menu size={24} color="#8B4513" strokeWidth={1.5} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleNotificationPress}
              className="mr-2"
            >
              <Bell size={24} color="#8B4513" strokeWidth={1.5} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}