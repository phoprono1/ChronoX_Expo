import {
  SafeAreaView,
  View,
  RefreshControl,
  Text,
  Share,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import React, { useEffect, useState } from "react";
import PostCard from "@/components/cards/PostCard";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";

import { account, client } from "@/constants/AppwriteClient";
import {
  getTargetId,
  getUserById,
  updateUserStatus,
} from "@/constants/AppwriteUser";
import {
  fetchPostById,
  fetchPostByStatisticsId,
  fetchPostsFirst,
  fetchPostsNext,
  getPostStatistics,
  getUserPostsCount,
  isPostLiked,
  toggleLikePost,
} from "@/constants/AppwritePost";
import { config } from "@/constants/Config";
import {
  getAvatarUrl,
  getFileDownload,
  getFileUrl,
} from "@/constants/AppwriteFile";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/store/userSlice";
import {
  cleanupNotifications,
  initializeNotifications,
  registerForPushNotificationsAsync,
} from "@/services/NotificationService";
import { Avatar } from "react-native-ui-lib";
import { Image, Video } from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";

const home = () => {
  const { isVisible } = useBottomSheet();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [lastID, setLastID] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);
  const { openBottomSheet } = useBottomSheet();
  const dispatch = useDispatch();
  const currentUserId = useSelector((state: any) => state.currentUser.$id);
  const userInfo = useSelector((state: any) => state.user);
  const [pushToken, setPushToken] = useState<string | undefined>();
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Gộp 2 effect notification thành 1
  useEffect(() => {
    let mounted = true;

    const setupNotifications = async () => {
      if (!currentUserId || !mounted) return;

      try {
        // Khởi tạo notification service trước
        await initializeNotifications();
        console.log("Notification service initialized");

        // Sau đó đăng ký và lấy token
        const token = await registerForPushNotificationsAsync();
        if (!token || !mounted) return;

        console.log("FCM Token received:", token);
        setPushToken(token);

        // Lấy và cập nhật target ID
        const targets = await getTargetId(currentUserId);
        const pushTarget = targets.find(
          (target) => target.providerType === "push"
        );

        if (pushTarget && mounted) {
          console.log("Push Target ID:", pushTarget.$id);
          setFcmToken(pushTarget.$id);
        } else {
          console.log("No push target found");
        }
      } catch (error) {
        console.error("Error in notification setup:", error);
      }
    };

    setupNotifications();

    // Cleanup khi unmount
    return () => {
      mounted = false;
      cleanupNotifications();
    };
  }, [currentUserId]); // Chỉ chạy lại khi currentUserId thay đổi

  const loadCurrentUserId = async () => {
    if (currentUserId) {
      await updateUserStatus(currentUserId, "online");
    } else {
      try {
        const currentAccount = await account.get();
        // Lấy thông tin người dùng đầy đủ
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
          postsCount: await getUserPostsCount(userDocument.$id), // Thêm postsCount nếu cần
        };
        // Cập nhật Redux store nếu cần
        dispatch(setUser(userInfo)); // Cập nhật userId và các thông tin khác vào Redux
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    }
  };

  useEffect(() => {
    loadCurrentUserId(); // Gọi hàm để lấy ID người dùng hiện tại
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadPosts(); // Gọi loadPosts khi currentUserId đã được thiết lập
      console.log("currentUserId đã hết null");
    } else {
      console.log("currentUserId vẫn là null");
    }
  }, [currentUserId]);

  const loadPosts = async () => {
    if (!currentUserId) loadCurrentUserId(); // Kiểm tra xem currentUserId đã được lấy chưa
    setLoading(true);
    try {
      const fetchedPosts = await fetchPostsFirst(limit);
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
      const fetchedPosts = await fetchPostsNext(lastID, limit);
      const uniquePosts = fetchedPosts.documents.filter(
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

  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.postCollectionId}.documents`,
      async (response) => {
        const payload = JSON.parse(JSON.stringify(response.payload)); // Chuyển đổi payload về đối tượng

        const newPostId = payload.$id; // Lấy $id từ payload
        // Lấy thông tin bài viết mới
        const newPost = await fetchPostById(newPostId); // Gọi hàm để lấy thông tin bài viết mới

        // Lấy thông tin người dùng từ accountID
        const userInfo = await getUserById(newPost.accountID.accountID); // Hàm này cần được tạo để lấy thông tin người dùng
        const liked = await isPostLiked(newPost.$id, currentUserId ?? "");
        const statisticsPost = (await getPostStatistics(newPost.$id)) || 0;

        // Kết hợp thông tin bài viết và người dùng
        const postWithUserInfo = {
          ...newPost,
          userInfo, // Thêm thông tin người dùng vào bài viết
          isLiked: liked,
          likes: statisticsPost.likes || 0,
          comments: statisticsPost.comments || 0,
        };

        setPosts((prevPosts) => [postWithUserInfo, ...prevPosts]); // Thêm bài viết mới vào đầu danh sách
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe_like_comment = client.subscribe(
      `databases.${config.databaseId}.collections.${config.statisticsPostCollectionId}.documents`,
      async (response) => {
        const payload = JSON.parse(JSON.stringify(response.payload)); // Chuyển đổi payload về đối tượng

        // Lấy ID bài viết từ payload
        const statisticsPostId = payload.$id;
        const postId = await fetchPostByStatisticsId(statisticsPostId);
        const updatedLikes = payload.likes; // Giả sử payload chứa số lượng likes mới
        const updatedComments = payload.comments; // Giả sử payload chứa số lượng comments mới

        // Kiểm tra currentUserId trước khi tiếp tục
        if (!currentUserId) {
          return; // Dừng lại nếu currentUserId chưa có giá trị
        }

        // Cập nhật số lượng likes cho bài viết tương ứng
        const liked = await isPostLiked(postId.$id, currentUserId);
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.$id === postId.$id
              ? {
                  ...post,
                  likes: updatedLikes,
                  comments: updatedComments,
                  isLiked: liked,
                }
              : post
          )
        );
      }
    );

    return () => {
      unsubscribe_like_comment();
    };
  }, [currentUserId]); // Thêm currentUserId vào dependency array

  const handleLike = async (postId: string, index: number) => {
    const post = posts[index];
    const newLikesCount = post.isLiked ? post.likes - 1 : post.likes + 1; // Cập nhật số lượng likes
    await toggleLikePost(postId, currentUserId ?? "");

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

  const handleUserInfo = (userId: string) => {
    router.push({
      pathname: "../../../(functions)/userInfo/[userInfo]",
      params: { userInfoId: userId, currentUserId: currentUserId },
    });
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

  const handlePost = () => {
    openBottomSheet("createPost");
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
        onUserInfoPress={() => handleUserInfo(item.userInfo.$id)}
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

  const HeaderComponent = () => {
    return (
      <View>
        <TouchableOpacity
          className="bg-[#F5F5F0] my-2 p-4 shadow-sm rounded-lg border border-[#D2B48C]"
          onPress={handlePost}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Avatar
                source={{ uri: getAvatarUrl(userInfo?.avatarId) }}
                size={40}
              />
              <Text className="text-base italic text-[#2F1810]">
                Bạn đang nghĩ gì?
              </Text>
            </View>
            <View className="flex-row items-center gap-4">
              <Image color="#8B4513" size={24} />
              <Video color="#8B4513" size={24} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 bg-[#CEC6B5]">
        <FlashList
          data={posts}
          renderItem={renderItem}
          estimatedItemSize={400} // Ước tính kích thước mỗi item
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
              <Text className="text-[#2F1810] text-lg">
                Không có bài viết nào
              </Text>
            </View>
          }
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingNext ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#8B4513" />
              </View>
            ) : null
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 16,
          }}
          ListHeaderComponent={HeaderComponent}
        />
      </View>
    </SafeAreaView>
  );
};

export default home;
