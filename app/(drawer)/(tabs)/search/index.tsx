import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";
import { getUserById, updateUserStatus } from "@/constants/AppwriteUser";
import { account } from "@/constants/AppwriteClient";
import {
  getUserPostsCount,
  isPostLiked,
  getMostLikedPosts,
  fetchPostByStatisticsId,
} from "@/constants/AppwritePost";
import { setUser } from "@/store/currentUser";
import LikedPostItem from "@/components/cards/LikedPostItem";
import AnimatedSearchBar from "@/components/search/AnimatedSearchBar";
import { router } from "expo-router"; // Thêm import này vì đang dùng Expo Router
import { SafeAreaView } from "react-native-safe-area-context";

interface UserInfo {
  $id: string;
  accountID: string;
  email: string;
  avatarId: string;
  username: string;
  bio?: string;
  followed?: number;
  follower?: number;
  location?: string;
  website?: string;
  status?: string;
}

interface Post {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  accountID: {
    accountID: string;
    $id?: string;
    $collectionId?: string;
    $createdAt?: string;
    $databaseId?: string;
    $permissions?: string[];
    $updatedAt?: string;
    avatarId?: string;
    bio?: string;
    email?: string;
    followed?: number;
    follower?: number;
    location?: string;
    status?: string;
    username?: string;
    website?: string;
  };
  userInfo: UserInfo;
  isLiked: boolean;
  likes: number;
  comments: number;
  fileIds: string[];
  title?: string;
  hashtags?: string[];
}

const Search: React.FC = () => {
  const { isVisible } = useBottomSheet();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const currentUserId = useSelector((state: any) => state.currentUser.$id);

  const loadCurrentUserId = async () => {
    if (currentUserId) {
      await updateUserStatus(currentUserId, "online");
      return;
    }

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
      console.error("Error fetching user info:", error);
    }
  };

  const formatUserInfo = (userDoc: any): UserInfo => ({
    $id: userDoc.$id,
    accountID: userDoc.accountID,
    email: userDoc.email || "",
    avatarId: userDoc.avatarId || "",
    username: userDoc.username || "",
    bio: userDoc.bio,
    followed: userDoc.followed,
    follower: userDoc.follower,
    location: userDoc.location,
    website: userDoc.website,
    status: userDoc.status,
  });

  const loadPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await getMostLikedPosts();
      const postsWithUserInfo = await Promise.all(
        fetchedPosts.documents.map(async (post) => {
          const postDetails = await fetchPostByStatisticsId(post.$id);
          const userDoc = await getUserById(postDetails.accountID.accountID);
          const userInfo = formatUserInfo(userDoc);
          const liked = await isPostLiked(postDetails.$id, currentUserId ?? "");

          return {
            ...postDetails,
            userInfo,
            isLiked: liked,
            likes: post.likes || 0,
            comments: post.comments || 0,
            fileIds: postDetails.fileIds || [],
            accountID: postDetails.accountID,
            $id: postDetails.$id,
            $collectionId: postDetails.$collectionId,
            $databaseId: postDetails.$databaseId,
            $createdAt: postDetails.$createdAt,
            $updatedAt: postDetails.$updatedAt,
            $permissions: postDetails.$permissions,
          } as Post;
        })
      );

      setPosts(postsWithUserInfo.filter((post) => post.fileIds?.length > 0));
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUserId();
    loadPosts();
  }, []);

  const renderItem = ({ item }: { item: Post }) => (
    <View className="flex-1 aspect-square max-w-[33.33%] p-0.5">
      <LikedPostItem
        key={item.$id}
        postId={item.$id}
        fileId={item.fileIds?.[0] || ""}
      />
    </View>
  );

  const renderHeader = () => (
    <View className="px-4 py-6 space-y-4 bg-[#CEC6B5] border-b border-[#D2B48C]">
      <AnimatedSearchBar
        isExpanded={false}
        onPress={() => router.push("/(drawer)/(tabs)/search/search_detail")}
      />
      <Text className="text-2xl font-bold text-[#8B4513]">Bài viết phổ biến</Text>
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-8">
      <Text className="text-[#8B7355] text-base">Không tìm thấy bài viết nào</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5F5F0]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B4513" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#CEC6B5]">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={renderItem}
        numColumns={3}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ 
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        stickyHeaderHiddenOnScroll={false}
      />
    </SafeAreaView>
  );
};

export default Search;
