import React, { useEffect, useState } from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { getFileUrl } from "@/constants/AppwriteFile";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";
import { Ionicons } from "@expo/vector-icons";

interface LikedPostItemProps {
  postId: string;
  fileId: string;
}

const LikedPostItem: React.FC<LikedPostItemProps> = ({ postId, fileId }) => {
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const { openBottomSheet } = useBottomSheet();

  useEffect(() => {
    const checkMediaType = async () => {
      const url = getFileUrl(fileId);
      setMediaUrl(url);
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("Content-Type");
      setMediaType(contentType?.startsWith("video/") ? "video" : "image");
    };

    checkMediaType();
  }, [fileId]);

  const handleComment = () => {
    openBottomSheet("comment", postId);
  };

  return (
    <TouchableOpacity 
      className="w-1/3 aspect-square p-1" 
      onPress={handleComment}
    >
      <View className="w-full h-full rounded-md overflow-hidden bg-gray-200">
        {mediaType === "video" ? (
          <Video
            source={{ uri: mediaUrl!! }}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted
            shouldPlay
            className="w-full h-full"
          />
        ) : (
          <Image
            source={{ uri: mediaUrl!! }}
            resizeMode="cover"
            className="w-full h-full"
          />
        )}
        {mediaType === "video" && (
          <View className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1">
            <Ionicons name="play" size={12} color="white" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default LikedPostItem;