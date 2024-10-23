import React, { useEffect, useState, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Dimensions,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { ResizeMode, Video } from "expo-av"; // Import Video từ expo-av
import RenderHTML from "react-native-render-html";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons
import { getAvatarUrl, getFileUrl } from "@/constants/AppwriteFile";

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

const ImageCounter = ({ current, total }: { current: number; total: number }) => (
  <View className="absolute bottom-2 right-2 bg-black bg-opacity-50 px-2 py-1 rounded-full">
    <Text className="text-white text-xs">
      {current}/{total}
    </Text>
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

  const renderSingleMedia = (fileId: string) => {
    const mediaUrl = getFileUrl(fileId);
    const isVideo = mediaTypes[0] === "video";

    return (
      <View className="w-full aspect-square overflow-hidden flex-1">
        {isVideo ? (
          <Video
            source={{ uri: mediaUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            className="h-full w-full max-w-full"
          />
        ) : (
          <Image
            source={{ uri: mediaUrl }}
            contentFit="cover"
            className="h-full w-full max-w-full"
          />
        )}
        {fileIds.length > 1 && (
          <ImageCounter current={1} total={fileIds.length} />
        )}
      </View>
    );
  };

  const renderMultipleMedia = () => {
  const { width: screenWidth } = Dimensions.get('window');
  
  return (
    <View className="w-full aspect-square relative">
      <FlatList
        horizontal
        data={fileIds}
        renderItem={({ item, index }) => (
          <View style={{ width: screenWidth/1.085, aspectRatio: 1 }}>
            {mediaTypes[index] === "video" ? (
              <Video
                source={{ uri: getFileUrl(item) }}
                useNativeControls
                resizeMode={ResizeMode.COVER}
                isLooping={false}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Image
                source={{ uri: getFileUrl(item) }}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
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
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
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
    <View className="bg-white rounded-lg overflow-hidden">
      <TouchableOpacity
        onPress={onUserInfoPress}
        className="flex-row items-center p-4"
      >
        <Image
          source={{ uri: getAvatarUrl(avatar) }}
          className="w-10 h-10 rounded-full"
        />
        <View className="ml-3">
          <Text className="font-bold text-gray-800">{username}</Text>
          <Text className="text-gray-500 text-sm">{email}</Text>
        </View>
        {showMoreOptionsIcon && (
          <Pressable className="ml-auto" onPress={showMoreOptions}>
            <Ionicons name="ellipsis-horizontal" size={24} color="gray" />
          </Pressable>
        )}
      </TouchableOpacity>

      {fileIds.length > 0 && (
        fileIds.length === 1 ? renderSingleMedia(fileIds[0]) : renderMultipleMedia()
      )}

      <View className="p-4">
        <TouchableOpacity onPress={onTitlePress}>
          <RenderHTMLMemo html={title} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onHashtagPress} className="mt-2">
          <Text className="text-blue-500 text-sm">
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
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={24}
              color={liked ? "red" : "gray"}
            />
            <Text className="ml-2 text-gray-600">{likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onComment}
            className="flex-row items-center"
          >
            <Ionicons name="chatbubble-outline" size={22} color="gray" />
            <Text className="ml-2 text-gray-600">{comments}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="gray" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PostCard;
