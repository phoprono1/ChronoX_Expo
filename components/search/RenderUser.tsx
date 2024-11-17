import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { getAvatarUrl } from '@/constants/AppwriteFile';
import { followUser, unfollowUser, isFollowing } from '@/constants/AppwriteFollow';

interface RenderUserProps {
  user: {
    $id: string;
    username: string;
    email: string;
    avatar: string;
  };
  currentUserId: string;
}

const RenderUser: React.FC<RenderUserProps> = ({ user, currentUserId }) => {
  const [isFollowed, setIsFollowed] = useState(false);

  useEffect(() => {
    checkFollowStatus();
  }, []);

  const checkFollowStatus = async () => {
    try {
      const followStatus = await isFollowing(currentUserId, user.$id);
      setIsFollowed(followStatus);
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái theo dõi:', error);
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (isFollowed) {
        await unfollowUser(currentUserId, user.$id);
      } else {
        await followUser(currentUserId, user.$id);
      }
      setIsFollowed(!isFollowed);
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái theo dõi:', error);
    }
  };

  return (
    <View className="flex-row items-center p-4 border-b border-[#D2B48C] bg-[#F5F5F0]">
      <View className="w-12 h-12 rounded-full overflow-hidden border border-[#D2B48C]">
        <Image
          source={{ uri: getAvatarUrl(user.avatar) }}
          className="w-full h-full"
          contentFit="cover"
        />
      </View>
      <View className="flex-1 ml-3">
        <Text className="font-bold text-base text-[#2F1810]">
          {user.username}
        </Text>
        <Text className="text-[#8B7355] text-sm">
          {user.email}
        </Text>
      </View>
      <TouchableOpacity
        className={`px-4 py-2 rounded-full border ${
          isFollowed 
            ? 'bg-[#F5F5F0] border-[#8B4513]' 
            : 'bg-[#8B4513] border-[#8B4513]'
        }`}
        onPress={handleFollowToggle}
        style={{
          shadowColor: '#2F1810',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 1,
          elevation: 2,
        }}
      >
        <Text className={`font-medium ${
          isFollowed ? 'text-[#8B4513]' : 'text-[#F5F5F0]'
        }`}>
          {isFollowed ? 'Bỏ theo dõi' : 'Theo dõi'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default RenderUser;