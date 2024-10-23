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

const EmptyItem = () => (
  <View className="w-1/3 aspect-square p-1">
    <View className="w-full h-full bg-transparent" />
  </View>
);

const Likes = () => {
  const user = useSelector((state: any) => state.user);
  const dispatch = useDispatch();
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

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    dispatch(setMinimized(offsetY > 50));
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.isEmptyItem) {
      return <EmptyItem />;
    }
    return (
      <LikedPostItem
        key={item.postCollections.$id}
        postId={item.postCollections.$id}
        fileId={item.postCollections.fileIds[0]}
      />
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Thêm 3 ô ảo vào cuối danh sách
  const dataWithEmptyItems = [
    ...likedPosts,
    { isEmptyItem: true },
    { isEmptyItem: true },
    { isEmptyItem: true },
  ];

  return (
    <SafeAreaView className="flex-0 bg-white h-3/4" edges={['bottom']}>
      <FlatList
        data={dataWithEmptyItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.postCollections?.$id || `empty-${index}`}
        numColumns={3}
        contentContainerStyle={{ padding: 4 }}
        onScroll={handleScroll}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-gray-500 text-lg">
              Không có bài viết yêu thích nào
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </SafeAreaView>
  );
};

export default Likes;
