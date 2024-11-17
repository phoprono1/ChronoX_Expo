import React from "react";
import { View, Text, Image } from "react-native";
import * as Localization from "expo-localization";
import { getAvatarUrl } from "@/constants/AppwriteFile";

interface CommentItemProps {
  item: any;
}

const CommentItem: React.FC<CommentItemProps> = ({ item }) => {
  const formattedDate = new Intl.DateTimeFormat(Localization.locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(item.$createdAt));

  return (
    <View className="flex-row items-start p-4 bg-[#F5F5F0] border-b border-[#D2B48C]">
      <Image
        source={{ uri: getAvatarUrl(item.userCollections.avatarId) }}
        className="w-10 h-10 rounded-full border border-[#8B4513]"
      />
      <View className="ml-3 flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-[#2F1810]">
            {item.userCollections.username}
          </Text>
          <Text className="text-xs text-[#8B7355]">{formattedDate}</Text>
        </View>
        <Text className="mt-1 text-[#2F1810]">{item.comment}</Text>
      </View>
    </View>
  );
};

export default CommentItem;