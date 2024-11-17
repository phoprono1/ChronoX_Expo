import { getAvatarUrl } from '@/constants/AppwriteFile';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Avatar } from 'react-native-ui-lib';
import { Phone, Video } from 'lucide-react-native';

interface UserAvatarProps {
  userId: string;
  userName: string;
  avatarUrl: string;
  startVideoCall: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ userId, userName, avatarUrl, startVideoCall }) => {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View className="p-[2px] rounded-full border border-[#D2B48C]">
          <Avatar
            source={{ uri: getAvatarUrl(avatarUrl) }}
            size={48}
            backgroundColor="#F5F5F0"
          />
        </View>
        <Text className="ml-3 text-lg font-medium text-[#2F1810]">
          {userName}
        </Text>
      </View>
      
      <View className="flex-row space-x-5">
        <TouchableOpacity 
          className="w-10 h-10 items-center justify-center rounded-full border border-[#D2B48C] bg-[#F5F5F0] active:bg-[#D2B48C]/20"
        >
          <Phone 
            size={20} 
            color="#8B4513"
            strokeWidth={1.5}
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={startVideoCall}
          className="w-10 h-10 items-center justify-center rounded-full border border-[#D2B48C] bg-[#F5F5F0] active:bg-[#D2B48C]/20"
        >
          <Video 
            size={20} 
            color="#8B4513"
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserAvatar;