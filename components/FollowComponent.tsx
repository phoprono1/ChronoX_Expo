import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { followUser, unfollowUser } from "@/constants/AppwriteFollow";
import { UserMinus, UserPlus, MessageCircle } from 'lucide-react-native';

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
          className="flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-full bg-[#F5F5F0] border border-[#8B4513]"
          onPress={handleUnfollow}
        >
          <UserMinus size={18} color="#8B4513" strokeWidth={2} />
          <Text className="ml-2 text-sm font-semibold text-[#2F1810]">
            Đang theo dõi
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-full bg-[#8B4513]"
          onPress={handleFollow}
        >
          <UserPlus size={18} color="#F5F5F0" strokeWidth={2} />
          <Text className="ml-2 text-sm font-semibold text-[#F5F5F0]">
            Theo dõi
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity className="flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-full bg-[#F5F5F0] border border-[#D2B48C]">
        <MessageCircle size={18} color="#8B4513" strokeWidth={2} />
        <Text className="ml-2 text-sm font-semibold text-[#2F1810]">
          Nhắn tin
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FollowComponent;