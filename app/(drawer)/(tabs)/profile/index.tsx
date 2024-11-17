import React, { useEffect, useState } from "react";
import { MaterialTabBar, Tabs } from "react-native-collapsible-tab-view";
import DisplayAvatar from "@/components/cards/UserProfile";
import { Query } from "react-native-appwrite";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";
import { account, databases } from "@/constants/AppwriteClient";
import { config } from "@/constants/Config";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/userSlice";
import { getUserPostsCount } from "@/constants/AppwritePost";
import Likes from "./top_tabs/likes";
import PostsList from "./top_tabs/profile";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";

const Profile = () => {
  const { isVisible } = useBottomSheet();
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
              email: userDocument.email,
              userId: userDocument.$id,
              avatarId: userDocument.avatarId,
              name: userDocument.username,
              bio: userDocument.bio || "",
              followed: userDocument.followed || 0,
              follower: userDocument.follower || 0,
              location: userDocument.location || null,
              website: userDocument.website || null,
              postsCount: await getUserPostsCount(userDocument.$id),
            })
          );
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    };

    fetchUserData();
  }, []);

  const Header = () => (
    <View className="bg-[#F5F5F0]">
      <DisplayAvatar />
    </View>
  );

  const renderTabBar = (props: any) => (
    <MaterialTabBar 
      {...props}
      indicatorStyle={{ 
        backgroundColor: '#8B4513',
        height: 2,
      }}
      activeColor="#8B4513"
      inactiveColor="#8B7355"
      labelStyle={{
        textTransform: 'none',
        fontSize: 15,
        fontWeight: '500',
      }}
      style={{
        backgroundColor: '#F5F5F0',
        borderBottomWidth: 1,
        borderBottomColor: '#D2B48C',
        elevation: 0,
        shadowOpacity: 0,
      }}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F0]">
      <Tabs.Container 
        renderHeader={Header}
        renderTabBar={renderTabBar}
      >
        <Tabs.Tab name="posts" label="Bài viết">
          <Tabs.ScrollView className="bg-[#F5F5F0]">
            <PostsList currentUserId={currentUserId} />
          </Tabs.ScrollView>
        </Tabs.Tab>
        <Tabs.Tab name="likes" label="Yêu thích">
          <Tabs.ScrollView className="bg-[#F5F5F0]">
            <Likes />
          </Tabs.ScrollView>
        </Tabs.Tab>
      </Tabs.Container>
    </SafeAreaView>
  );
};

export default Profile;
