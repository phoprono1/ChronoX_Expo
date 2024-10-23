import { View } from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import DisplayAvatar from "@/components/cards/UserProfile";
import { Query } from "react-native-appwrite";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";
import {
  useSharedValue,
} from "react-native-reanimated";
import { account, databases } from "@/constants/AppwriteClient";
import { config } from "@/constants/Config";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/userSlice";
import { getUserPostsCount } from "@/constants/AppwritePost";
import TopTabs from "./top_tabs/_layout";

const Profile = () => {
  const { isVisible } = useBottomSheet();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0); // Thêm biến để theo dõi vị trí Y
  const router = useRouter();
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
          dispatch(
            setUser({
              // Dispatch action để cập nhật trạng thái
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
            })
          );
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <View>
      <View className="w-full">
        <View className="justify-center">
          <DisplayAvatar />
        </View>
      </View>
      <View className="w-full h-screen">
        <TopTabs />
      </View>
    </View>
  );
};

export default Profile;
