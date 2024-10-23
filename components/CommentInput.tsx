import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Dimensions,
  LayoutChangeEvent,
  FlatList,
} from "react-native";
import PostCard from "./cards/PostCard";
import {
  fetchPostById,
  isPostLiked,
  getPostStatistics,
  toggleLikePost,
  createComment,
  getCommentsByPostId,
} from "@/constants/AppwritePost"; // Import hàm để lấy bài viết
import { getCurrentUserId, getUserById } from "@/constants/AppwriteUser";
import { account, client } from "@/constants/AppwriteClient";
import CommentItem from "./CommentItem";
import { config } from "@/constants/Config";
import CommentInputField from "./CommentInputField";

interface CommentInputProps {
  onSubmit: (comment: string) => void;
  postId: string; // Thêm postId vào props
}

const CommentInput: React.FC<CommentInputProps> = ({ onSubmit, postId }) => {
  const [comment, setComment] = useState("");
  const [postData, setPostData] = useState<any>(null); // State để lưu thông tin bài viết
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false); // State để theo dõi trạng thái bàn phím
  const { width } = Dimensions.get("window"); // Lấy chiều rộng màn hình
  const flatListRef = useRef<FlatList>(null);

  const handleSubmit = async () => {
    if (comment.trim()) {
      await createComment(postId, currentUserId ?? "", comment);
      onSubmit(comment);

      // Cập nhật số lượng bình luận trong postData
      setPostData((prevPostData: any) => ({
        ...prevPostData,
        comments: prevPostData.comments + 1, // Tăng số lượng bình luận lên 1
      }));

      setComment(""); // Reset input
      //tạo hàm đóng keyboard
      Keyboard.dismiss();
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

  // Hàm để lấy thông tin bài viết
  const loadPostData = async () => {
    if (currentUserId == null) {
      loadCurrentUserId();
    }
    try {
      const data = await fetchPostById(postId);
      const userInfo = await getUserById(data.accountID.accountID);
      const liked = await isPostLiked(postId, currentUserId ?? "");
      const statisticsPost = (await getPostStatistics(postId)) || 0;
      // Lấy danh sách bình luận
      const commentResponse = await getCommentsByPostId(postId);
      const commentList = commentResponse.documents || []; // Đảm bảo commentList là một mảng

      setPostData({
        ...data,
        userInfo,
        isLiked: liked,
        likes: statisticsPost.likes || 0,
        comments: statisticsPost.comments || 0,
        commentList, // Lưu commentList vào postData
      });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin bài viết:", error);
    }
  };

  useEffect(() => {
    loadCurrentUserId();
    loadPostData(); // Gọi hàm khi component được khởi tạo
  }, [postId]);

  useEffect(() => {
    if (currentUserId) {
      loadPostData(); // Gọi loadPosts khi currentUserId đã được thiết lập
    } else {
      console.log("currentUserId vẫn là null");
    }
  }, [currentUserId]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true); // Bàn phím hiện ra
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false); // Bàn phím ẩn
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = client.subscribe(
      `databases.${config.databaseId}.collections.${config.commentCollectionId}.documents`,
      async (response) => {
        if (!currentUserId) {
          await loadCurrentUserId(); // Đợi cho đến khi currentUserId được thiết lập
        }
        await loadPostData(); // Đảm bảo currentUserId đã có giá trị
      }
    );

    return () => {
      subscription();
    };
  }, [currentUserId]);

  const handleLike = async () => {
    if (!postData) return; // Kiểm tra xem postData có tồn tại không

    try {
      const newLikesCount = postData.isLiked
        ? postData.likes - 1
        : postData.likes + 1; // Cập nhật số lượng likes

      // Gọi hàm để toggle like
      await toggleLikePost(postData.$id, currentUserId ?? "");

      // Cập nhật trạng thái liked và số lượng likes trong state
      setPostData((prevPostData: any) => ({
        ...prevPostData,
        isLiked: !prevPostData.isLiked,
        likes: newLikesCount,
      }));
    } catch (error) {
      console.error("Lỗi khi thích bài viết:", error);
    }
  };

  return (
    <View className="bg-gray-50">
      <ScrollView
        className="p-4 mb-16"
        contentContainerStyle={{ paddingBottom: keyboardVisible ? width/1.1 : 0 }} // Thêm khoảng cách khi bàn phím hiện ra
        automaticallyAdjustsScrollIndicatorInsets
      >
        {postData ? (
          <>
            <PostCard
              avatar={postData.userInfo?.avatarId || ""}
              username={postData.userInfo?.username || "Unknown User"}
              email={postData.userInfo?.email || "No Email"}
              fileIds={postData.fileIds}
              title={postData.title}
              hashtags={postData.hashtags}
              likes={postData.likes}
              comments={postData.comments}
              isLiked={postData.isLiked}
              onLike={handleLike}
              onTitlePress={() => {}}
              onHashtagPress={() => {}}
              onUserInfoPress={() => {}}
              onComment={() => {}}
              onShare={() => {
                throw new Error("Function not implemented.");
              }}
              showMoreOptionsIcon={false}
            />
            <View className="mt-4">
              <Text className="text-lg font-bold px-4 py-2 bg-white border-b border-gray-200">
                Bình luận
              </Text>
              {postData.commentList.length > 0 ? (
                postData.commentList.map((comment: any) => (
                  <CommentItem key={comment.$id} item={comment} />
                ))
              ) : (
                <View className="p-8 items-center justify-center">
                  <Text className="text-gray-500 text-center">
                    Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center p-8">
            <ActivityIndicator size="large" color="#4B5563" />
            <Text className="mt-4 text-gray-600">Đang tải dữ liệu...</Text>
          </View>
        )}

        <View className="mb-8"/>
      </ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 20}
        className="absolute bottom-0 left-0 right-0 padding-0"
      >
        <CommentInputField
          placeholder="Nhập bình luận..."
          value={comment}
          onChangeText={setComment}
          onSubmit={handleSubmit}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

export default CommentInput;
