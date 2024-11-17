import React, { useEffect, useState, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { ResizeMode, Video } from "expo-av"; // Import Video từ expo-av
import RenderHTML from "react-native-render-html";
import { getAvatarUrl, getFileUrl } from "@/constants/AppwriteFile";

import {
  MoreHorizontal,
  Heart,
  MessageCircle,
  Share,
} from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";

interface PostCardProps {
  avatar: string;
  username: string;
  email: string;
  fileIds: string[]; // Thay đổi từ mediaUri sang fileIds
  title: string;
  hashtags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onTitlePress: () => void;
  onHashtagPress: () => void;
  onUserInfoPress: () => void;
  showMoreOptionsIcon?: boolean; // Thêm thuộc tính này
}

const ImageCounter = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => (
  <View className="absolute bottom-2 left-1/2 -translate-x-1/2 flex-row gap-1.5">
    {Array.from({ length: total }).map((_, index) => (
      <View
        key={index}
        className={`h-2 w-2 rounded-full ${
          index === current - 1 ? "bg-[#8B4513]" : "bg-[#D2B48C] opacity-60"
        }`}
      />
    ))}
  </View>
);

const PostCard: React.FC<PostCardProps> = ({
  avatar,
  username,
  email,
  fileIds = [], // Provide a default empty array
  title,
  hashtags,
  likes,
  comments,
  isLiked,
  onLike,
  onComment,
  onShare,
  onTitlePress,
  onHashtagPress,
  onUserInfoPress,
  showMoreOptionsIcon = true, // Mặc định là true
}) => {
  const [liked, setLiked] = useState(isLiked); // Trạng thái thích
  const [mediaTypes, setMediaTypes] = useState<string[]>([]); // Lưu trữ loại media
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const textStyle = {
    color: "black",
    fontSize: 18,
  };

  const tagsStyle = {
    div: textStyle,
    p: textStyle,
    ol: textStyle,
    ul: textStyle,
    li: textStyle,
    h1: textStyle,
    h4: textStyle,
  };

  // Cập nhật trạng thái liked khi isLiked props thay đổi
  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);

  const handleLike = async () => {
    setLiked(!liked); // Đảo ngược trạng thái thích
    await onLike(); // Gọi hàm onLike
  };

  const handleShare = () => {
    // Thêm logic chia sẻ ở đây
    onShare();
  };

  const showMoreOptions = () => {
    console.log("Show more options");
  };

  // Hàm kiểm tra MIME type
  const getMimeType = async (url: string): Promise<string | null> => {
    if (url === "") {
      return null;
    }
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("Content-Type");
      return contentType; // Trả về MIME type
    } catch (error) {
      console.error("Lỗi khi lấy MIME type:", error);
      return null; // Trả về null nếu có lỗi
    }
  };

  useEffect(() => {
    const checkMediaTypes = async () => {
      const types = await Promise.all(
        fileIds.map(async (fileId) => {
          const url = getFileUrl(fileId);
          const mimeType = await getMimeType(url);
          return mimeType?.startsWith("video/") ? "video" : "image";
        })
      );
      setMediaTypes(types);
    };

    checkMediaTypes();
  }, [fileIds]);

  const renderSingleMedia = (fileId: string) => (
    <View className="w-full aspect-square relative">
      {mediaTypes[0] === "video" ? (
        <Video
          source={{ uri: getFileUrl(fileId) }}
          useNativeControls
          resizeMode={ResizeMode.COVER}
          isLooping={false}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <Image
          source={{ uri: getFileUrl(fileId) }}
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
          transition={200}
          onLoadStart={() => <ActivityIndicator color="#8B4513" />}
          onError={() => {/* Xử lý lỗi load ảnh */}}
        />
      )}
    </View>
  );

  const renderMultipleMedia = () => {
    const { width: screenWidth } = Dimensions.get("window");
  
    return (
      <View className="w-full aspect-square relative">
        <FlashList
          horizontal
          data={fileIds}
          estimatedItemSize={screenWidth}
          renderItem={({ item, index }) => (
            <View style={{ width: screenWidth / 1.085, aspectRatio: 1 }}>
              {mediaTypes[index] === "video" ? (
                <Video
                  source={{ uri: getFileUrl(item) }}
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                  isLooping={false}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Image
                  source={{ uri: getFileUrl(item) }}
                  contentFit="cover"
                  style={{ width: "100%", height: "100%" }}
                />
              )}
            </View>
          )}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={screenWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(
              e.nativeEvent.contentOffset.x / screenWidth
            );
            setCurrentImageIndex(newIndex);
          }}
        />
        <ImageCounter current={currentImageIndex + 1} total={fileIds.length} />
      </View>
    );
  };

  const RenderHTMLMemo = memo(({ html }: { html: string }) => (
    <RenderHTML
      contentWidth={Dimensions.get("window").width}
      source={{ html }}
      tagsStyles={tagsStyle}
    />
  ));

  return (
    <View className="bg-[#F5F5F0] rounded-lg overflow-hidden border border-[#D2B48C]">
      <TouchableOpacity
        onPress={onUserInfoPress}
        className="flex-row items-center p-4 border-b border-[#D2B48C]"
      >
        <Image
          source={{ uri: getAvatarUrl(avatar) }}
          className="w-10 h-10 rounded-full border border-[#8B4513]"
        />
        <View className="ml-3">
          <Text className="font-bold text-[#2F1810]">{username}</Text>
          <Text className="text-[#8B7355] text-sm">{email}</Text>
        </View>
        {showMoreOptionsIcon && (
          <Pressable className="ml-auto" onPress={showMoreOptions}>
            <MoreHorizontal size={24} color="#8B4513" strokeWidth={1.5} />
          </Pressable>
        )}
      </TouchableOpacity>

      {/* Media content giữ nguyên cấu trúc */}
      {fileIds.length > 0 && (
        <View className="border-y border-[#D2B48C]">
          {fileIds.length === 1
            ? renderSingleMedia(fileIds[0])
            : renderMultipleMedia()}
        </View>
      )}

      <View className={`p-4 ${fileIds.length > 0 ? "" : "border-t-0"}`}>
        <TouchableOpacity onPress={onTitlePress}>
          <RenderHTMLMemo html={title} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onHashtagPress} className="mt-2">
          <Text className="text-[#8B4513] text-sm">
            {hashtags.map((tag) => `#${tag}`).join(" ")}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between items-center px-4 pb-4">
        <View className="flex-row">
          <TouchableOpacity
            onPress={handleLike}
            className="flex-row items-center mr-4"
          >
            {liked ? (
              <Heart
                size={24}
                fill="#8B4513"
                color="#8B4513"
                strokeWidth={1.5}
              />
            ) : (
              <Heart size={24} color="#8B7355" strokeWidth={1.5} />
            )}
            <Text className="ml-2 text-[#2F1810]">{likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onComment}
            className="flex-row items-center"
          >
            <MessageCircle size={22} color="#8B7355" strokeWidth={1.5} />
            <Text className="ml-2 text-[#2F1810]">{comments}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleShare}>
          <Share size={24} color="#8B7355" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PostCard;
