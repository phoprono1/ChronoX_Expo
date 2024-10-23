import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons, SimpleLineIcons } from "@expo/vector-icons";
import { followUser, unfollowUser } from "@/constants/AppwriteFollow";

interface FollowComponentProps {
  followerId: string;
  followedId: string;
  isFollowing: boolean;
}

const FollowComponent: React.FC<FollowComponentProps> = ({
  followerId,
  followedId,
  isFollowing,
}) => {
  const handleFollow = async () => {
    try {
      await followUser(followerId, followedId);
    } catch (error) {
      console.error("Lỗi khi theo dõi:", error);
    }
  };

  const handleUnfollow = async () => {
    try {
      await unfollowUser(followerId, followedId);
    } catch (error) {
      console.error("Lỗi khi hủy theo dõi:", error);
    }
  };

  return (
    <View className="flex-row justify-between items-center space-x-3 my-4 px-4">
      {isFollowing ? (
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-full bg-gray-200"
          onPress={handleUnfollow}
        >
          <SimpleLineIcons name="user-unfollow" size={18} color="#4B5563" />
          <Text className="ml-2 text-sm font-semibold text-gray-700">
            Đang theo dõi
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-full bg-blue-500"
          onPress={handleFollow}
        >
          <SimpleLineIcons name="user-follow" size={18} color="white" />
          <Text className="ml-2 text-sm font-semibold text-white">
            Theo dõi
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity className="flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-full bg-gray-100">
        <MaterialIcons name="message" size={18} color="#4B5563" />
        <Text className="ml-2 text-sm font-semibold text-gray-700">
          Nhắn tin
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FollowComponent;