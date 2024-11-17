import {
  FlatList,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Share,
  View,
  RefreshControl,
  Text,
  Dimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { getUserById } from "@/constants/AppwriteUser";
import {
  fetchUserPostsFirst,
  fetchUserPostsNext,
  getPostStatistics,
  isPostLiked,
  toggleLikePost,
} from "@/constants/AppwritePost";
import PostCard from "@/components/cards/PostCard"; // Import component PostCard
import { useDispatch, useSelector } from "react-redux";
import { setMinimized } from "@/store/minimizeUsersInfoSlice";
import { getFileDownload, getFileUrl } from "@/constants/AppwriteFile";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";
import { clearUserInfo } from "@/store/usersInfo";
import { FlashList } from "@shopify/flash-list";

const Index = () => {
  const userInfo = useSelector((state: any) => state.userInfo); // Lấy trạng thái người dùng từ Redux
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [lastID, setLastID] = useState<string | null>(null);
  const [limit, setLimit] = useState(3);
  const dispatch = useDispatch();
  const { openBottomSheet } = useBottomSheet();
  const { height } = Dimensions.get("window");
  const extraSpace = height * 0.15; // 50% chiều cao màn hình

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 100) {
      dispatch(setMinimized(true)); // Cập nhật trạng thái isMinimized
    } else {
      dispatch(setMinimized(false));
    }
  };

  useEffect(() => {
    if (userInfo) {
      loadPosts(); // Gọi loadPosts khi currentUserId đã được thiết lập
    } else {
      console.log("currentUserId vẫn là null");
    }
  }, [userInfo]);

  useEffect(() => {
    // Cleanup function để clear user info khi component unmount
    return () => {
      dispatch(clearUserInfo());
    };
  }, [dispatch]);

  const loadPosts = async () => {
    if (!userInfo) return; // Dừng lại nếu currentUserId chưa có giá trị
    setLoading(true);
    try {
      const fetchedPosts = await fetchUserPostsFirst(userInfo.$id, limit);
      const postsWithUserInfo = await Promise.all(
        fetchedPosts.map(async (post) => {
          const userInfo = await getUserById(post.accountID.accountID);
          const liked = await isPostLiked(post.$id, userInfo.$id ?? "");
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
    if (!userInfo.$id || loadingNext || !lastID) return;
    setLoadingNext(true);
    try {
      const fetchedPosts = await fetchUserPostsNext(
        userInfo.$id,
        lastID,
        limit
      );
      const uniquePosts = fetchedPosts.filter(
        (post) => !posts.some((existingPost) => existingPost.$id === post.$id)
      );

      const postsWithUserInfo = await Promise.all(
        uniquePosts.map(async (post) => {
          const userInfo = await getUserById(post.accountID.accountID);
          const liked = await isPostLiked(post.$id, userInfo.$id ?? "");
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
    await toggleLikePost(postId, userInfo.$id ?? "");

    // Cập nhật trạng thái liked và số lượng likes trong state
    setPosts((prevPosts) =>
      prevPosts.map((p, i) =>
        i === index ? { ...p, isLiked: !post.isLiked, likes: newLikesCount } : p
      )
    );
  };

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
    <View className="mt-2 mb-2 bg-[#F5F5F0] shadow-sm rounded-lg overflow-hidden border border-[#D2B48C]">
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
        onTitlePress={() => handleComment(item.$id)}
        onHashtagPress={() => {}}
        onLike={() => handleLike(item.$id, index)}
        onComment={() => handleComment(item.$id)}
        onShare={() =>
          handleShareFile(
            getFileUrl(item.fileIds),
            item.fileExtension,
            item.fileIds,
            item.title
          )
        }
        showMoreOptionsIcon={true}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-[#CEC6B5]" style={{ height: '100%' }}>
      <FlashList
        data={posts}
        renderItem={renderItem}
        estimatedItemSize={500}
        keyExtractor={(item) => item.$id}
        refreshControl={
          <RefreshControl 
            onRefresh={loadPosts} 
            refreshing={loading}
            colors={["#8B4513"]}
            tintColor="#8B4513"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-[#2F1810]">Không có bài viết nào</Text>
          </View>
        }
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        drawDistance={500}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        ListFooterComponent={
          loadingNext ? (
            <View className="py-4 h-20">
              <ActivityIndicator size="small" color="#8B4513" />
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: extraSpace,
        }}
        onScroll={handleScroll}
        scrollEnabled={false}
      />
    </View>
  );
};

export default Index;
