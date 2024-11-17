import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { getUserLikedPosts } from "@/constants/AppwritePost";
import { useDispatch, useSelector } from "react-redux";
import LikedPostItem from "@/components/cards/LikedPostItem";
import { setMinimized } from "@/store/minimizeSlice";
import { SafeAreaView } from "react-native-safe-area-context";

const Likes = () => {
  const user = useSelector((state: any) => state.user);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLikedPosts = async () => {
    try {
      setLoading(true);
      const posts = await getUserLikedPosts(user.userId);
      setLikedPosts(posts.documents);
    } catch (error) {
      console.error("Lỗi khi lấy bài viết yêu thích:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLikedPosts();
  }, [user.userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLikedPosts();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F5F5F0]">
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => (
    <View className="flex-1 aspect-square max-w-[33.33%] p-0.5">
      <View className="rounded-lg overflow-hidden border border-[#D2B48C]">
        <LikedPostItem
          key={item.postCollections.$id}
          postId={item.postCollections.$id}
          fileId={item.postCollections.fileIds[0]}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F0]" edges={["bottom"]}>
      <FlatList
        data={likedPosts}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.postCollections?.$id || `empty-${index}`
        }
        numColumns={3}
        contentContainerStyle={{ 
          padding: 4,
          minHeight: '100%',
        }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-[#8B7355] text-base">
              Không có bài viết yêu thích nào
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor="#8B4513"
            colors={["#8B4513"]}
          />
        }
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default Likes;
