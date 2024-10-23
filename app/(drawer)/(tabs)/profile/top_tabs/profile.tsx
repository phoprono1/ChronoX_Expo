import {
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Share,
  View,
  RefreshControl,
  Text
} from "react-native";
import React, { useEffect, useState } from "react";
import { getCurrentUserId, getUserById } from "@/constants/AppwriteUser";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { account } from "@/constants/AppwriteClient";
import {
  fetchUserPostsFirst,
  fetchUserPostsNext,
  getPostStatistics,
  isPostLiked,
  toggleLikePost,
} from "@/constants/AppwritePost";
import PostCard from "@/components/cards/PostCard"; // Import component PostCard
import DisplayAvatar from "@/components/cards/UserProfile";
import { useDispatch, useSelector } from "react-redux";
import { setMinimized } from "@/store/minimizeSlice";
import { getFileDownload } from "@/constants/AppwriteFile";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";
import Footer from "@/components/Footer";

const Index = () => {
  // Sử dụng kiểu đã định nghĩa
  const scale = useSharedValue(1);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [lastID, setLastID] = useState<string | null>(null);
  const [limit, setLimit] = useState(3);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const dispatch = useDispatch();
  const isMinimized = useSelector((state: any) => state.minimize.isMinimized); // Lấy trạng thái isMinimized từ Redux
  const { openBottomSheet } = useBottomSheet();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 100) {
      dispatch(setMinimized(true)); // Cập nhật trạng thái isMinimized
    } else {
      dispatch(setMinimized(false));
    }
  };

  const loadCurrentUserId = async () => {
    try {
      const currentAccount = await account.get();
      const currentUserId = await getCurrentUserId(currentAccount.$id);
      setCurrentUserId(currentUserId);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
    }
  };

  useEffect(() => {
    loadCurrentUserId(); // Gọi hàm để lấy ID người dùng hiện tại
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadPosts(); // Gọi loadPosts khi currentUserId đã được thiết lập
    } else {
      console.log("currentUserId vẫn là null");
    }
  }, [currentUserId]);

  const loadPosts = async () => {
    if (!currentUserId) return; // Dừng lại nếu currentUserId chưa có giá trị
    setLoading(true);
    try {
      const fetchedPosts = await fetchUserPostsFirst(currentUserId, limit);
      const postsWithUserInfo = await Promise.all(
        fetchedPosts.map(async (post) => {
          const userInfo = await getUserById(post.accountID.accountID);
          const liked = await isPostLiked(post.$id, currentUserId ?? "");
          const statisticsPost = (await getPostStatistics(post.$id)) || 0;
          return {
            ...post,
            userInfo,
            isLiked: liked,
            likes: statisticsPost.likes || 0,
            comments: statisticsPost.comments || 0,
          };
        })
      );
      setPosts(postsWithUserInfo);
      setLastID(
        fetchedPosts.length > 0
          ? fetchedPosts[fetchedPosts.length - 1].$id
          : null
      );
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!currentUserId || loadingNext || !lastID) return;
    setLoadingNext(true);
    try {
      const fetchedPosts = await fetchUserPostsNext(
        currentUserId,
        lastID,
        limit
      );
      const uniquePosts = fetchedPosts.filter(
        (post) => !posts.some((existingPost) => existingPost.$id === post.$id)
      );
  
      const postsWithUserInfo = await Promise.all(
        uniquePosts.map(async (post) => {
          const userInfo = await getUserById(post.accountID.accountID);
          const liked = await isPostLiked(post.$id, currentUserId);
          const statisticsPost = await getPostStatistics(post.$id);
          return {
            ...post,
            userInfo,
            isLiked: liked,
            likes: statisticsPost.likes || 0,
            comments: statisticsPost.comments || 0,
          };
        })
      );
  
      setPosts((prevPosts) => [...prevPosts, ...postsWithUserInfo]);
      setLastID(
        uniquePosts.length > 0 ? uniquePosts[uniquePosts.length - 1].$id : null
      );
    } catch (error) {
      console.error("Lỗi khi tải thêm bài viết:", error);
    } finally {
      setLoadingNext(false);
    }
  };

  const handleLike = async (postId: string, index: number) => {
    const post = posts[index];
    const newLikesCount = post.isLiked ? post.likes - 1 : post.likes + 1; // Cập nhật số lượng likes
    const statisticsPost = await getPostStatistics(postId);

    await toggleLikePost(postId, currentUserId ?? "");

    // Cập nhật trạng thái liked và số lượng likes trong state
    setPosts((prevPosts) =>
      prevPosts.map((p, i) =>
        i === index ? { ...p, isLiked: !post.isLiked, likes: newLikesCount } : p
      )
    );
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Tạo hàm handleComment
  const handleComment = (postId: string) => {
    openBottomSheet("comment", postId); // Mở modal bình luận và truyền postId
  };
  // Hàm chia sẻ file
  const handleShareFile = async (
    fileUrl: string | string[],
    fileExtension: string,
    fileIds: string[],
    title: string
  ) => {
    try {
      if (Array.isArray(fileUrl)) {
        fileUrl = fileUrl[0];
      }

      if (typeof fileUrl !== "string") {
        throw new Error("URL không hợp lệ");
      }

      // Tải file về
      const downloadResponse = await getFileDownload(fileIds[0]); // Giả sử hàm này trả về một đối tượng chứa đường dẫn tệp
      const localFilePath =
        downloadResponse.href || downloadResponse.toString(); // Lấy đường dẫn tệp đã tải về
      // Chia sẻ file
      await Share.share({
        url: localFilePath, // Sử dụng đường dẫn tệp đã tải về
        message: title,
        title: `Chia sẻ tệp: ${fileUrl.split("/").pop()}`, // Tên tệp từ URL
      });
    } catch (error) {
      console.error("Lỗi khi chia sẻ file:", error);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View className="mt-2 mb-2 bg-white shadow-sm rounded-lg overflow-hidden">

      <PostCard
        avatar={item.userInfo?.avatarId || ""}
        username={item.userInfo?.username || "Unknown User"}
        email={item.userInfo?.email || "No Email"}
        fileIds={item.fileIds}
        title={item.title}
        hashtags={item.hashtags}
        likes={item.likes}
        comments={item.comments}
        isLiked={item.isLiked}
        onUserInfoPress={() => {}}
        onLike={() => handleLike(item.$id, index)} // Gọi hàm handleLike
        onTitlePress={() => handleComment(item.$id)}
        onHashtagPress={() => {}}
        onComment={() => handleComment(item.$id)}
        onShare={() =>
          handleShareFile(
            item.mediaUri,
            item.fileExtension,
            item.fileIds,
            item.title
          )
        }
        showMoreOptionsIcon={false}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.$id}
        refreshControl={
          <RefreshControl onRefresh={loadPosts} refreshing={loading} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500">Không có bài viết nào</Text>
          </View>
        }
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingNext ? (
            <View className="py-4">
              <ActivityIndicator size="small" color="#0000ff" />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onScroll={handleScroll}
      />
      <View className="mb-44"/>
    </SafeAreaView>
  );
};

export default Index;
